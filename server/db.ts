import { eq, desc, or, isNull, and, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, User,
  socials, InsertSocial, Social,
  contentTypes, InsertContentType, ContentType,
  objectives, InsertObjective, Objective,
  channels, InsertChannel, Channel,
  audiences, InsertAudience, Audience,
  utmLinks, InsertUtmLink, UtmLink,
  publicationImages, InsertPublicationImage, PublicationImage,
  gdriveSync, InsertGdriveSync,
  clickEvents, InsertClickEvent, ClickEvent
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ==================== USER OPERATIONS ====================
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number): Promise<User | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

export async function getAllUsers(): Promise<User[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt));
}

// ==================== SOCIALS OPERATIONS ====================
// Retourne les réseaux système (userId = null) + les réseaux privés de l'utilisateur
export async function getAllSocials(userId?: number): Promise<Social[]> {
  const db = await getDb();
  if (!db) return [];
  
  if (userId) {
    return db.select().from(socials)
      .where(or(isNull(socials.userId), eq(socials.userId, userId)))
      .orderBy(socials.nom);
  }
  return db.select().from(socials).where(isNull(socials.userId)).orderBy(socials.nom);
}

export async function createSocial(data: InsertSocial): Promise<Social> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(socials).values(data);
  const result = await db.select().from(socials).orderBy(desc(socials.id)).limit(1);
  return result[0];
}

export async function getSocialByName(nom: string, userId?: number): Promise<Social | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  // Chercher d'abord dans les réseaux système
  let result = await db.select().from(socials)
    .where(and(eq(socials.nom, nom), isNull(socials.userId)))
    .limit(1);
  
  if (result[0]) return result[0];
  
  // Sinon chercher dans les réseaux de l'utilisateur
  if (userId) {
    result = await db.select().from(socials)
      .where(and(eq(socials.nom, nom), eq(socials.userId, userId)))
      .limit(1);
  }
  return result[0];
}

// ==================== CONTENT TYPES OPERATIONS ====================
export async function getAllContentTypes(userId?: number): Promise<ContentType[]> {
  const db = await getDb();
  if (!db) return [];
  
  if (userId) {
    return db.select().from(contentTypes)
      .where(or(isNull(contentTypes.userId), eq(contentTypes.userId, userId)))
      .orderBy(contentTypes.nom);
  }
  return db.select().from(contentTypes).where(isNull(contentTypes.userId)).orderBy(contentTypes.nom);
}

export async function createContentType(data: InsertContentType): Promise<ContentType> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(contentTypes).values(data);
  const result = await db.select().from(contentTypes).orderBy(desc(contentTypes.id)).limit(1);
  return result[0];
}

export async function getContentTypeByName(nom: string, userId?: number): Promise<ContentType | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  let result = await db.select().from(contentTypes)
    .where(and(eq(contentTypes.nom, nom), isNull(contentTypes.userId)))
    .limit(1);
  
  if (result[0]) return result[0];
  
  if (userId) {
    result = await db.select().from(contentTypes)
      .where(and(eq(contentTypes.nom, nom), eq(contentTypes.userId, userId)))
      .limit(1);
  }
  return result[0];
}

// ==================== OBJECTIVES OPERATIONS ====================
export async function getAllObjectives(userId?: number): Promise<Objective[]> {
  const db = await getDb();
  if (!db) return [];
  
  if (userId) {
    return db.select().from(objectives)
      .where(or(isNull(objectives.userId), eq(objectives.userId, userId)))
      .orderBy(objectives.nom);
  }
  return db.select().from(objectives).where(isNull(objectives.userId)).orderBy(objectives.nom);
}

export async function createObjective(data: InsertObjective): Promise<Objective> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(objectives).values(data);
  const result = await db.select().from(objectives).orderBy(desc(objectives.id)).limit(1);
  return result[0];
}

export async function getObjectiveByName(nom: string, userId?: number): Promise<Objective | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  let result = await db.select().from(objectives)
    .where(and(eq(objectives.nom, nom), isNull(objectives.userId)))
    .limit(1);
  
  if (result[0]) return result[0];
  
  if (userId) {
    result = await db.select().from(objectives)
      .where(and(eq(objectives.nom, nom), eq(objectives.userId, userId)))
      .limit(1);
  }
  return result[0];
}

// ==================== CHANNELS OPERATIONS ====================
export async function getAllChannels(userId?: number): Promise<Channel[]> {
  const db = await getDb();
  if (!db) return [];
  
  if (userId) {
    return db.select().from(channels)
      .where(or(isNull(channels.userId), eq(channels.userId, userId)))
      .orderBy(channels.nom);
  }
  return db.select().from(channels).where(isNull(channels.userId)).orderBy(channels.nom);
}

export async function createChannel(data: InsertChannel): Promise<Channel> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(channels).values(data);
  const result = await db.select().from(channels).orderBy(desc(channels.id)).limit(1);
  return result[0];
}

export async function getChannelById(id: number): Promise<Channel | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(channels).where(eq(channels.id, id)).limit(1);
  return result[0];
}

// ==================== AUDIENCES OPERATIONS ====================
export async function getAllAudiences(userId?: number): Promise<Audience[]> {
  const db = await getDb();
  if (!db) return [];
  
  if (userId) {
    return db.select().from(audiences)
      .where(or(isNull(audiences.userId), eq(audiences.userId, userId)))
      .orderBy(audiences.nom);
  }
  return db.select().from(audiences).where(isNull(audiences.userId)).orderBy(audiences.nom);
}

export async function createAudience(data: InsertAudience): Promise<Audience> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(audiences).values(data);
  const result = await db.select().from(audiences).orderBy(desc(audiences.id)).limit(1);
  return result[0];
}

export async function getAudienceByName(nom: string, userId?: number): Promise<Audience | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  let result = await db.select().from(audiences)
    .where(and(eq(audiences.nom, nom), isNull(audiences.userId)))
    .limit(1);
  
  if (result[0]) return result[0];
  
  if (userId) {
    result = await db.select().from(audiences)
      .where(and(eq(audiences.nom, nom), eq(audiences.userId, userId)))
      .limit(1);
  }
  return result[0];
}

// ==================== UTM LINKS OPERATIONS ====================
// Utilisateur standard: voit uniquement ses liens
// Admin: voit tous les liens (avec option de filtrer par userId)
export async function getAllUtmLinks(userId: number, isAdmin: boolean = false, filterUserId?: number): Promise<UtmLink[]> {
  const db = await getDb();
  if (!db) return [];
  
  if (isAdmin) {
    if (filterUserId) {
      return db.select().from(utmLinks)
        .where(eq(utmLinks.userId, filterUserId))
        .orderBy(desc(utmLinks.createdAt));
    }
    return db.select().from(utmLinks).orderBy(desc(utmLinks.createdAt));
  }
  
  // Utilisateur standard: uniquement ses propres liens
  return db.select().from(utmLinks)
    .where(eq(utmLinks.userId, userId))
    .orderBy(desc(utmLinks.createdAt));
}

export async function createUtmLink(data: InsertUtmLink): Promise<UtmLink> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(utmLinks).values(data);
  const result = await db.select().from(utmLinks).orderBy(desc(utmLinks.id)).limit(1);
  return result[0];
}

export async function getUtmLinkById(id: number): Promise<UtmLink | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(utmLinks).where(eq(utmLinks.id, id)).limit(1);
  return result[0];
}

export async function deleteUtmLink(id: number, userId: number, isAdmin: boolean = false): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Vérifier que l'utilisateur a le droit de supprimer ce lien
  const link = await getUtmLinkById(id);
  if (!link) return false;
  
  if (!isAdmin && link.userId !== userId) {
    throw new Error("Unauthorized: You can only delete your own links");
  }
  
  await db.delete(utmLinks).where(eq(utmLinks.id, id));
  return true;
}

// ==================== PUBLICATION IMAGES OPERATIONS ====================
export async function getImagesByUtmLinkId(utmLinkId: number): Promise<PublicationImage[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(publicationImages).where(eq(publicationImages.utmLinkId, utmLinkId));
}

export async function createPublicationImage(data: InsertPublicationImage): Promise<PublicationImage> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(publicationImages).values(data);
  const result = await db.select().from(publicationImages).orderBy(desc(publicationImages.id)).limit(1);
  return result[0];
}

export async function deletePublicationImage(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(publicationImages).where(eq(publicationImages.id, id));
}

// ==================== GDRIVE SYNC OPERATIONS ====================
export async function updateGdriveSync(tableName: string, recordCount: number, status: string = "success", errorMessage?: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(gdriveSync).values({
    tableName,
    recordCount,
    status,
    errorMessage,
    lastSyncAt: new Date(),
  });
}

export async function getLastSync(tableName: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(gdriveSync)
    .where(eq(gdriveSync.tableName, tableName))
    .orderBy(desc(gdriveSync.lastSyncAt))
    .limit(1);
  return result[0];
}

// ==================== UTM LINK BY SLUG ====================
export async function getUtmLinkBySlug(slug: string): Promise<UtmLink | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(utmLinks).where(eq(utmLinks.slug, slug)).limit(1);
  return result[0];
}

export async function updateUtmLinkSlug(id: number, slug: string, shortUrl: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(utmLinks).set({ slug, shortUrl }).where(eq(utmLinks.id, id));
}

// ==================== CLICK EVENTS OPERATIONS ====================
export async function createClickEvent(data: InsertClickEvent): Promise<ClickEvent> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(clickEvents).values(data);
  const result = await db.select().from(clickEvents).orderBy(desc(clickEvents.id)).limit(1);
  return result[0];
}

export async function getClickEventsByUtmLinkId(utmLinkId: number): Promise<ClickEvent[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(clickEvents)
    .where(eq(clickEvents.utmLinkId, utmLinkId))
    .orderBy(desc(clickEvents.clickedAt));
}

export async function incrementClickCount(utmLinkId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(utmLinks)
    .set({ clickCount: sql`${utmLinks.clickCount} + 1` })
    .where(eq(utmLinks.id, utmLinkId));
}

// Statistiques de clics pour un lien spécifique
export async function getClickEventsStats(utmLinkId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const events = await db.select().from(clickEvents).where(eq(clickEvents.utmLinkId, utmLinkId));
  
  // Calculer les statistiques
  const totalClicks = events.length;
  
  // Par pays
  const byCountry: Record<string, number> = {};
  events.forEach(e => {
    const country = e.country || 'Inconnu';
    byCountry[country] = (byCountry[country] || 0) + 1;
  });
  
  // Par appareil
  const byDevice: Record<string, number> = {};
  events.forEach(e => {
    const device = e.deviceType || 'Inconnu';
    byDevice[device] = (byDevice[device] || 0) + 1;
  });
  
  // Par navigateur
  const byBrowser: Record<string, number> = {};
  events.forEach(e => {
    const browser = e.browser || 'Inconnu';
    byBrowser[browser] = (byBrowser[browser] || 0) + 1;
  });
  
  // Par OS
  const byOS: Record<string, number> = {};
  events.forEach(e => {
    const os = e.os || 'Inconnu';
    byOS[os] = (byOS[os] || 0) + 1;
  });
  
  // Par jour (7 derniers jours)
  const byDay: Record<string, number> = {};
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const key = date.toISOString().split('T')[0];
    byDay[key] = 0;
  }
  events.forEach(e => {
    const day = new Date(e.clickedAt).toISOString().split('T')[0];
    if (byDay[day] !== undefined) {
      byDay[day]++;
    }
  });
  
  return {
    totalClicks,
    byCountry,
    byDevice,
    byBrowser,
    byOS,
    byDay,
    recentClicks: events.slice(0, 20) // 20 derniers clics
  };
}

// Statistiques globales pour l'admin
export async function getGlobalClickStats(filterUserId?: number) {
  const db = await getDb();
  if (!db) return null;
  
  let links: UtmLink[];
  if (filterUserId) {
    links = await db.select().from(utmLinks).where(eq(utmLinks.userId, filterUserId));
  } else {
    links = await db.select().from(utmLinks);
  }
  
  const linkIds = links.map(l => l.id);
  if (linkIds.length === 0) return { totalClicks: 0, byCountry: {}, byDevice: {}, byBrowser: {}, byOS: {}, byDay: {} };
  
  // Récupérer tous les clics pour ces liens
  const allEvents: ClickEvent[] = [];
  for (const linkId of linkIds) {
    const events = await db.select().from(clickEvents).where(eq(clickEvents.utmLinkId, linkId));
    allEvents.push(...events);
  }
  
  // Calculer les statistiques globales
  const totalClicks = allEvents.length;
  
  const byCountry: Record<string, number> = {};
  const byDevice: Record<string, number> = {};
  const byBrowser: Record<string, number> = {};
  const byOS: Record<string, number> = {};
  const byDay: Record<string, number> = {};
  
  // Initialiser les 7 derniers jours
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    byDay[date.toISOString().split('T')[0]] = 0;
  }
  
  allEvents.forEach(e => {
    const country = e.country || 'Inconnu';
    byCountry[country] = (byCountry[country] || 0) + 1;
    
    const device = e.deviceType || 'Inconnu';
    byDevice[device] = (byDevice[device] || 0) + 1;
    
    const browser = e.browser || 'Inconnu';
    byBrowser[browser] = (byBrowser[browser] || 0) + 1;
    
    const os = e.os || 'Inconnu';
    byOS[os] = (byOS[os] || 0) + 1;
    
    const day = new Date(e.clickedAt).toISOString().split('T')[0];
    if (byDay[day] !== undefined) {
      byDay[day]++;
    }
  });
  
  return {
    totalClicks,
    totalLinks: links.length,
    byCountry,
    byDevice,
    byBrowser,
    byOS,
    byDay,
  };
}

// ==================== EXPORT WITH USER INFO ====================
export async function getUtmLinksWithUserInfo(userId: number, isAdmin: boolean = false): Promise<(UtmLink & { userName?: string; userEmail?: string })[]> {
  const db = await getDb();
  if (!db) return [];
  
  let links: UtmLink[];
  if (isAdmin) {
    links = await db.select().from(utmLinks).orderBy(desc(utmLinks.createdAt));
  } else {
    links = await db.select().from(utmLinks)
      .where(eq(utmLinks.userId, userId))
      .orderBy(desc(utmLinks.createdAt));
  }
  
  // Enrichir avec les infos utilisateur
  const enrichedLinks = await Promise.all(links.map(async (link) => {
    const user = await getUserById(link.userId);
    return {
      ...link,
      userName: user?.name || undefined,
      userEmail: user?.email || undefined,
    };
  }));
  
  return enrichedLinks;
}

// ==================== UTILITY FUNCTIONS ====================

// Fonction pour slugifier une chaîne
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
    .replace(/[^a-z0-9\s-]/g, '') // Supprimer les caractères spéciaux
    .replace(/\s+/g, '_') // Remplacer les espaces par des underscores
    .replace(/-+/g, '_') // Remplacer les tirets par des underscores
    .substring(0, 50); // Limiter la longueur
}

// Générer un slug unique - optimisé pour être court (style Bitly)
// 5 caractères = 60,466,176 combinaisons possibles (36^5)
export function generateUniqueSlug(): string {
  // Utiliser un alphabet étendu pour plus de combinaisons avec moins de caractères
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789'; // Sans i, l, o, 0, 1 pour éviter confusion
  let slug = '';
  for (let i = 0; i < 5; i++) {
    slug += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return slug;
}

export function generateUtmUrl(
  destinationUrl: string,
  utmSource: string,
  utmMedium: string,
  utmCampaign: string,
  utmTerm?: string,
  utmContent?: string
): string {
  const url = new URL(destinationUrl);
  url.searchParams.set('utm_source', utmSource);
  url.searchParams.set('utm_medium', utmMedium);
  url.searchParams.set('utm_campaign', utmCampaign);
  if (utmTerm) url.searchParams.set('utm_term', utmTerm);
  if (utmContent) url.searchParams.set('utm_content', utmContent);
  return url.toString();
}

// ==================== DATA CLEANUP ====================
export async function deleteTestData(): Promise<{ deleted: number }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  let totalDeleted = 0;
  
  // Supprimer les liens UTM contenant "test"
  const testLinks = await db.select().from(utmLinks)
    .where(sql`LOWER(${utmLinks.destinationUrl}) LIKE '%test%' 
      OR LOWER(${utmLinks.utmSource}) LIKE '%test%'
      OR LOWER(${utmLinks.utmCampaign}) LIKE '%test%'
      OR LOWER(${utmLinks.angleMarketing}) LIKE '%test%'
      OR LOWER(${utmLinks.hook}) LIKE '%test%'`);
  
  for (const link of testLinks) {
    await db.delete(clickEvents).where(eq(clickEvents.utmLinkId, link.id));
    await db.delete(publicationImages).where(eq(publicationImages.utmLinkId, link.id));
    await db.delete(utmLinks).where(eq(utmLinks.id, link.id));
    totalDeleted++;
  }
  
  // Supprimer les réseaux sociaux personnalisés contenant "test"
  await db.delete(socials).where(sql`LOWER(${socials.nom}) LIKE '%test%' AND ${socials.userId} IS NOT NULL`);
  
  // Supprimer les types de contenu personnalisés contenant "test"
  await db.delete(contentTypes).where(sql`LOWER(${contentTypes.nom}) LIKE '%test%' AND ${contentTypes.userId} IS NOT NULL`);
  
  // Supprimer les objectifs personnalisés contenant "test"
  await db.delete(objectives).where(sql`LOWER(${objectives.nom}) LIKE '%test%' AND ${objectives.userId} IS NOT NULL`);
  
  // Supprimer les audiences personnalisées contenant "test"
  await db.delete(audiences).where(sql`LOWER(${audiences.nom}) LIKE '%test%' AND ${audiences.userId} IS NOT NULL`);
  
  // Supprimer les canaux contenant "test"
  await db.delete(channels).where(sql`LOWER(${channels.nom}) LIKE '%test%'`);
  
  return { deleted: totalDeleted };
}
