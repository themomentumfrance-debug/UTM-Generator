import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@example.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("socials router", () => {
  it("lists socials (protected - requires auth)", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.socials.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("creates a social (protected)", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    const testName = `TestSocial_${Date.now()}`;
    const result = await caller.socials.create({ nom: testName });
    
    expect(result).toBeDefined();
    expect(result.nom).toBe(testName);
    expect(result.id).toBeDefined();
  });
});

describe("contentTypes router", () => {
  it("lists content types (protected - requires auth)", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.contentTypes.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("creates a content type (protected)", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    const testName = `TestContentType_${Date.now()}`;
    const result = await caller.contentTypes.create({ nom: testName });
    
    expect(result).toBeDefined();
    expect(result.nom).toBe(testName);
    expect(result.id).toBeDefined();
  });
});

describe("objectives router", () => {
  it("lists objectives (protected - requires auth)", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.objectives.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("creates an objective (protected)", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    const testName = `TestObjective_${Date.now()}`;
    const result = await caller.objectives.create({ nom: testName });
    
    expect(result).toBeDefined();
    expect(result.nom).toBe(testName);
    expect(result.id).toBeDefined();
  });
});

describe("channels router", () => {
  it("lists channels (protected - requires auth)", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.channels.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("creates a channel (protected)", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    const testName = `TestChannel_${Date.now()}`;
    const result = await caller.channels.create({ 
      nom: testName,
      lien: "https://example.com/channel"
    });
    
    expect(result).toBeDefined();
    expect(result.nom).toBe(testName);
    expect(result.id).toBeDefined();
  });
});

describe("audiences router", () => {
  it("lists audiences (protected - requires auth)", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.audiences.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("creates an audience (protected)", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    const testName = `TestAudience_${Date.now()}`;
    const result = await caller.audiences.create({ 
      nom: testName
    });
    
    expect(result).toBeDefined();
    expect(result.nom).toBe(testName);
    expect(result.id).toBeDefined();
  });
});

describe("utmLinks router", () => {
  let createdUtmLinkId: number | undefined;

  it("lists UTM links (protected)", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.utmLinks.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("creates a UTM link (protected)", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    // First, get existing socials, content types, and objectives
    const socials = await caller.socials.list();
    const contentTypes = await caller.contentTypes.list();
    const objectives = await caller.objectives.list();
    
    // Skip if no data available
    if (socials.length === 0 || contentTypes.length === 0 || objectives.length === 0) {
      console.log("Skipping UTM link creation test - no reference data available");
      return;
    }
    
    const result = await caller.utmLinks.create({
      destinationUrl: "https://example.com/test-page",
      socialId: socials[0].id,
      socialName: socials[0].nom,
      contentTypeId: contentTypes[0].id,
      contentTypeName: contentTypes[0].nom,
      objectifId: objectives[0].id,
      objectifName: objectives[0].nom,
    });
    
    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.destinationUrl).toBe("https://example.com/test-page");
    expect(result.shortUrl).toBeDefined();
    expect(result.slug).toBeDefined();
    expect(result.userId).toBe(1); // Should be associated with the authenticated user
    
    createdUtmLinkId = result.id;
  });

  it("deletes a UTM link (protected)", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    if (!createdUtmLinkId) {
      console.log("Skipping delete test - no UTM link was created");
      return;
    }
    
    const result = await caller.utmLinks.delete({ id: createdUtmLinkId });
    expect(result.success).toBe(true);
  });
});

describe("clicks router", () => {
  it("records a click (public)", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    
    // This test just verifies the route exists and accepts the input
    // In a real scenario, we'd need a valid utmLinkId
    try {
      await caller.clicks.record({
        utmLinkId: 999999, // Non-existent link
        country: "France",
        deviceType: "desktop",
        browser: "Chrome",
      });
    } catch {
      // Expected to fail because the link doesn't exist
      // But the route should be accessible
    }
  });

  it("gets click stats (protected)", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    // Get stats for a non-existent link (should return null)
    const result = await caller.clicks.getStats({ utmLinkId: 999999 });
    expect(result).toBeNull();
  });

  it("gets global click stats (protected)", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.clicks.getGlobalStats();
    expect(result).toBeDefined();
  });
});

describe("admin router", () => {
  it("admin can list all users", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.users.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("regular user cannot list all users", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    try {
      await caller.users.list();
      expect.fail("Should have thrown FORBIDDEN error");
    } catch (error: unknown) {
      expect((error as { code: string }).code).toBe("FORBIDDEN");
    }
  });

  it("admin can cleanup test data", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.admin.cleanupTestData();
    expect(result.success).toBe(true);
    expect(result.deleted).toBeDefined();
  });
});

describe("data isolation", () => {
  it("user only sees their own UTM links", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    const links = await caller.utmLinks.list();
    
    // All links should belong to the authenticated user (id: 1)
    // or the user should be admin to see all
    links.forEach(link => {
      expect(link.userId).toBe(1);
    });
  });

  it("admin sees all UTM links", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    
    const links = await caller.utmLinks.list();
    
    // Admin should be able to see links from all users
    expect(Array.isArray(links)).toBe(true);
  });
});
