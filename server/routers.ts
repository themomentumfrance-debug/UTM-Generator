import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { 
  getAllSocials, createSocial, getSocialByName,
  getAllContentTypes, createContentType, getContentTypeByName,
  getAllObjectives, createObjective, getObjectiveByName,
  getAllChannels, createChannel,
  getAllAudiences, createAudience, getAudienceByName,
  getAllUtmLinks, createUtmLink, getUtmLinkById, deleteUtmLink,
  createPublicationImage, getImagesByUtmLinkId, deletePublicationImage,
  generateUtmUrl, slugify, generateUniqueSlug, getUtmLinkBySlug, updateUtmLinkSlug,
  createClickEvent, getClickEventsByUtmLinkId, incrementClickCount, getClickEventsStats,
  getGlobalClickStats, getUtmLinksWithUserInfo, getAllUsers, deleteTestData
} from "./db";
import { storagePut } from "./storage";
import { invokeLLM } from "./_core/llm";
import { nanoid } from "nanoid";
import { TRPCError } from "@trpc/server";

// Base URL pour les liens courts (sera remplacé par l'URL de production)
const getBaseUrl = () => {
  return process.env.VITE_APP_URL || 'https://3000-ir1box0nydp7i30w5mgum-aef6942c.us2.manus.computer';
};

// Middleware pour vérifier le rôle admin
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user?.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ==================== USERS (Admin only) ====================
  users: router({
    list: adminProcedure.query(async () => {
      return getAllUsers();
    }),
  }),

  // ==================== SOCIALS ====================
  socials: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      // Retourne les réseaux système + les réseaux privés de l'utilisateur
      return getAllSocials(ctx.user?.id);
    }),
    create: protectedProcedure
      .input(z.object({ nom: z.string().min(1) }))
      .mutation(async ({ input, ctx }) => {
        // Vérifier si existe déjà (système ou utilisateur)
        const existing = await getSocialByName(input.nom, ctx.user?.id);
        if (existing) return existing;
        // Créer comme réseau privé de l'utilisateur
        return createSocial({ nom: input.nom, userId: ctx.user?.id });
      }),
  }),

  // ==================== CONTENT TYPES ====================
  contentTypes: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getAllContentTypes(ctx.user?.id);
    }),
    create: protectedProcedure
      .input(z.object({ nom: z.string().min(1) }))
      .mutation(async ({ input, ctx }) => {
        const existing = await getContentTypeByName(input.nom, ctx.user?.id);
        if (existing) return existing;
        return createContentType({ nom: input.nom, userId: ctx.user?.id });
      }),
  }),

  // ==================== OBJECTIVES ====================
  objectives: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getAllObjectives(ctx.user?.id);
    }),
    create: protectedProcedure
      .input(z.object({ nom: z.string().min(1) }))
      .mutation(async ({ input, ctx }) => {
        const existing = await getObjectiveByName(input.nom, ctx.user?.id);
        if (existing) return existing;
        return createObjective({ nom: input.nom, userId: ctx.user?.id });
      }),
  }),

  // ==================== CHANNELS ====================
  channels: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getAllChannels(ctx.user?.id);
    }),
    create: protectedProcedure
      .input(z.object({ 
        nom: z.string().min(1),
        lien: z.string().optional()
      }))
      .mutation(async ({ input, ctx }) => {
        return createChannel({ 
          nom: input.nom, 
          lien: input.lien,
          userId: ctx.user?.id 
        });
      }),
  }),

  // ==================== AUDIENCES ====================
  audiences: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getAllAudiences(ctx.user?.id);
    }),
    create: protectedProcedure
      .input(z.object({ nom: z.string().min(1) }))
      .mutation(async ({ input, ctx }) => {
        const existing = await getAudienceByName(input.nom, ctx.user?.id);
        if (existing) return existing;
        return createAudience({ nom: input.nom, userId: ctx.user?.id });
      }),
  }),

  // ==================== UTM LINKS ====================
  utmLinks: router({
    list: protectedProcedure
      .input(z.object({ filterUserId: z.number().optional() }).optional())
      .query(async ({ ctx, input }) => {
        const isAdmin = ctx.user?.role === 'admin';
        const userId = ctx.user?.id;
        if (!userId) return [];
        
        // Admin peut filtrer par utilisateur, sinon voit tout
        // Utilisateur standard ne voit que ses propres liens
        return getAllUtmLinks(userId, isAdmin, input?.filterUserId);
      }),
    
    // Liste avec infos utilisateur pour l'export CSV
    listWithUserInfo: protectedProcedure
      .query(async ({ ctx }) => {
        const isAdmin = ctx.user?.role === 'admin';
        const userId = ctx.user?.id;
        if (!userId) return [];
        return getUtmLinksWithUserInfo(userId, isAdmin);
      }),
    
    // Création de lien UTM avec génération automatique des paramètres
    create: protectedProcedure
      .input(z.object({
        destinationUrl: z.string().url(),
        socialId: z.number(),
        socialName: z.string(),
        contentTypeId: z.number(),
        contentTypeName: z.string(),
        channelId: z.number().optional(),
        channelName: z.string().optional(),
        channelLink: z.string().optional(),
        objectifId: z.number(),
        objectifName: z.string(),
        audienceId: z.number().optional(),
        angleMarketing: z.string().optional(),
        hook: z.string().optional(),
        audienceCible: z.string().optional(),
        budget: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user?.id) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User not authenticated' });
        }
        
        // Génération automatique des paramètres UTM
        const utmSource = slugify(input.socialName);
        const utmMedium = slugify(input.contentTypeName);
        const utmCampaign = slugify(input.objectifName);
        const utmContent = input.hook || input.angleMarketing 
          ? slugify(input.hook || input.angleMarketing || '') 
          : undefined;
        const utmTerm = input.audienceCible 
          ? slugify(input.audienceCible) 
          : undefined;
        
        const generatedUrl = generateUtmUrl(
          input.destinationUrl,
          utmSource,
          utmMedium,
          utmCampaign,
          utmTerm,
          utmContent
        );
        
        // Générer un slug unique pour le raccourcisseur
        let slug = generateUniqueSlug();
        let existingSlug = await getUtmLinkBySlug(slug);
        while (existingSlug) {
          slug = generateUniqueSlug();
          existingSlug = await getUtmLinkBySlug(slug);
        }
        
        const shortUrl = `${getBaseUrl()}/s/${slug}`;
        
        // Créer le canal si nom fourni
        let channelId = input.channelId;
        if (input.channelName && !channelId) {
          const channel = await createChannel({ 
            nom: input.channelName, 
            lien: input.channelLink,
            userId: ctx.user.id
          });
          channelId = channel.id;
        }
        
        const utmLink = await createUtmLink({
          destinationUrl: input.destinationUrl,
          socialId: input.socialId,
          contentTypeId: input.contentTypeId,
          channelId,
          objectifId: input.objectifId,
          audienceId: input.audienceId,
          utmSource,
          utmMedium,
          utmCampaign,
          utmTerm: utmTerm || null,
          utmContent: utmContent || null,
          generatedUrl,
          slug,
          shortUrl,
          angleMarketing: input.angleMarketing,
          hook: input.hook,
          audienceCible: input.audienceCible,
          budget: input.budget,
          userId: ctx.user.id, // Associer au propriétaire
          createdBy: ctx.user.id,
        });
        
        return utmLink;
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user?.id) {
          throw new TRPCError({ code: 'UNAUTHORIZED' });
        }
        const isAdmin = ctx.user.role === 'admin';
        await deleteUtmLink(input.id, ctx.user.id, isAdmin);
        return { success: true };
      }),
      
    // Route pour récupérer un lien par son slug (pour la redirection)
    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        return getUtmLinkBySlug(input.slug);
      }),
  }),

  // ==================== CLICK TRACKING ====================
  clicks: router({
    // Enregistrer un clic (utilisé par la route de redirection)
    record: publicProcedure
      .input(z.object({
        utmLinkId: z.number(),
        country: z.string().optional(),
        countryCode: z.string().optional(),
        city: z.string().optional(),
        region: z.string().optional(),
        deviceType: z.string().optional(),
        browser: z.string().optional(),
        browserVersion: z.string().optional(),
        os: z.string().optional(),
        osVersion: z.string().optional(),
        platform: z.string().optional(),
        referer: z.string().optional(),
        userAgent: z.string().optional(),
        ipAddress: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await createClickEvent({
          utmLinkId: input.utmLinkId,
          country: input.country,
          countryCode: input.countryCode,
          city: input.city,
          region: input.region,
          deviceType: input.deviceType,
          browser: input.browser,
          browserVersion: input.browserVersion,
          os: input.os,
          osVersion: input.osVersion,
          platform: input.platform,
          referer: input.referer,
          userAgent: input.userAgent,
          ipAddress: input.ipAddress,
        });
        await incrementClickCount(input.utmLinkId);
        return { success: true };
      }),

    // Obtenir les statistiques de clics pour un lien
    getStats: protectedProcedure
      .input(z.object({ utmLinkId: z.number() }))
      .query(async ({ input, ctx }) => {
        // Vérifier que l'utilisateur a accès à ce lien
        const link = await getUtmLinkById(input.utmLinkId);
        if (!link) return null;
        
        const isAdmin = ctx.user?.role === 'admin';
        if (!isAdmin && link.userId !== ctx.user?.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
        }
        
        return getClickEventsStats(input.utmLinkId);
      }),

    // Obtenir tous les clics pour un lien
    getByUtmLink: protectedProcedure
      .input(z.object({ utmLinkId: z.number() }))
      .query(async ({ input, ctx }) => {
        const link = await getUtmLinkById(input.utmLinkId);
        if (!link) return [];
        
        const isAdmin = ctx.user?.role === 'admin';
        if (!isAdmin && link.userId !== ctx.user?.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
        }
        
        return getClickEventsByUtmLinkId(input.utmLinkId);
      }),
    
    // Statistiques globales (admin ou utilisateur)
    getGlobalStats: protectedProcedure
      .input(z.object({ filterUserId: z.number().optional() }).optional())
      .query(async ({ ctx, input }) => {
        const isAdmin = ctx.user?.role === 'admin';
        const userId = ctx.user?.id;
        
        if (isAdmin) {
          // Admin peut voir les stats globales ou filtrées par utilisateur
          return getGlobalClickStats(input?.filterUserId);
        } else {
          // Utilisateur standard ne voit que ses propres stats
          return getGlobalClickStats(userId);
        }
      }),
  }),

  // ==================== PUBLICATION IMAGES ====================
  images: router({
    listByUtmLink: protectedProcedure
      .input(z.object({ utmLinkId: z.number() }))
      .query(async ({ input }) => {
        return getImagesByUtmLinkId(input.utmLinkId);
      }),
    
    upload: protectedProcedure
      .input(z.object({
        utmLinkId: z.number(),
        fileName: z.string(),
        fileData: z.string(), // Base64 encoded
        mimeType: z.string(),
      }))
      .mutation(async ({ input }) => {
        const buffer = Buffer.from(input.fileData, 'base64');
        const fileKey = `utm-images/${input.utmLinkId}/${nanoid()}-${input.fileName}`;
        
        const { url } = await storagePut(fileKey, buffer, input.mimeType);
        
        return createPublicationImage({
          utmLinkId: input.utmLinkId,
          fileName: input.fileName,
          fileKey,
          url,
          mimeType: input.mimeType,
          fileSize: buffer.length,
        });
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deletePublicationImage(input.id);
        return { success: true };
      }),
  }),

  // ==================== LLM SUGGESTIONS ====================
  suggestions: router({
    getMarketingSuggestions: protectedProcedure
      .input(z.object({
        social: z.string(),
        contentType: z.string(),
        objective: z.string(),
        currentAngle: z.string().optional(),
        currentHook: z.string().optional(),
        audience: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const prompt = `Tu es un expert en marketing digital et en création de contenu pour les réseaux sociaux.

Contexte de la publication:
- Réseau social: ${input.social}
- Type de contenu: ${input.contentType}
- Objectif: ${input.objective}
${input.audience ? `- Audience ciblée: ${input.audience}` : ''}
${input.currentAngle ? `- Angle marketing actuel: ${input.currentAngle}` : ''}
${input.currentHook ? `- Hook actuel: ${input.currentHook}` : ''}

Génère des suggestions d'optimisation pour améliorer l'impact de cette publication. Fournis:
1. 3 suggestions d'angles marketing alternatifs ou améliorés
2. 3 suggestions de hooks accrocheurs adaptés au réseau social
3. Des conseils spécifiques pour maximiser l'engagement sur ${input.social}

Réponds en français de manière concise et actionnable.`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: "Tu es un expert en marketing digital spécialisé dans l'optimisation de contenu pour les réseaux sociaux." },
            { role: "user", content: prompt }
          ],
        });

        return {
          suggestions: response.choices[0]?.message?.content || "Aucune suggestion disponible",
        };
      }),
      
    // Analyse avancée des performances
    analyzePerformance: protectedProcedure
      .input(z.object({
        links: z.array(z.object({
          social: z.string(),
          contentType: z.string(),
          objective: z.string(),
          angle: z.string().optional(),
          hook: z.string().optional(),
        })),
      }))
      .mutation(async ({ input }) => {
        const linksDescription = input.links.map((l, i) => 
          `${i + 1}. ${l.social} - ${l.contentType} - ${l.objective}${l.angle ? ` - Angle: ${l.angle}` : ''}${l.hook ? ` - Hook: ${l.hook}` : ''}`
        ).join('\n');
        
        const prompt = `Tu es un expert en marketing digital. Analyse les publications suivantes et fournis des recommandations stratégiques:

${linksDescription}

Fournis:
1. Une analyse des patterns observés (réseaux les plus utilisés, types de contenu privilégiés, objectifs dominants)
2. Des recommandations pour diversifier la stratégie
3. Des suggestions d'angles marketing et de hooks qui pourraient améliorer les performances
4. Des conseils spécifiques par réseau social utilisé

Réponds en français de manière structurée et actionnable.`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: "Tu es un expert en marketing digital et en analyse de performance de contenu." },
            { role: "user", content: prompt }
          ],
        });

        return {
          analysis: response.choices[0]?.message?.content || "Aucune analyse disponible",
        };
      }),
  }),

  // ==================== ADMIN OPERATIONS ====================
  admin: router({
    // Nettoyer les données de test
    cleanupTestData: adminProcedure.mutation(async () => {
      const result = await deleteTestData();
      return { success: true, ...result };
    }),
  }),

  // ==================== SEED DATA ====================
  seed: router({
    initializeDefaults: protectedProcedure.mutation(async () => {
      // Seed socials - Liste complète avec groupement logique (sans userId = système)
      const defaultSocials = [
        'YouTube', 'YouTube Ads',
        'Facebook', 'Facebook Ads',
        'Instagram', 'Instagram Ads',
        'WhatsApp', 'WhatsApp Ads',
        'Threads', 'Threads Ads',
        'TikTok', 'TikTok for Business',
        'X', 'X Ads',
        'Snapchat', 'Snapchat Ads',
        'LinkedIn', 'LinkedIn Ads',
        'Pinterest', 'Pinterest Ads',
        'Google Ads', 'Apple Search Ads',
      ];
      for (const nom of defaultSocials) {
        const existing = await getSocialByName(nom);
        if (!existing) await createSocial({ nom }); // Sans userId = système
      }

      // Seed content types (sans userId = système)
      const defaultContentTypes = ['Photo', 'Vidéo', 'Texte', 'Sondage', 'Story', 'Reel', 'Live', 'Short', 'Visuel'];
      for (const nom of defaultContentTypes) {
        const existing = await getContentTypeByName(nom);
        if (!existing) await createContentType({ nom });
      }

      // Seed objectives (sans userId = système)
      const defaultObjectives = ['Conversion', 'Lead', 'Trafic', 'Vente', 'Notoriété', 'Engagement'];
      for (const nom of defaultObjectives) {
        const existing = await getObjectiveByName(nom);
        if (!existing) await createObjective({ nom });
      }

      // Seed audiences (sans userId = système)
      const defaultAudiences = [
        'Entrepreneur',
        'Étudiants',
        'Salariés',
        'PME et TPE',
        'Freelances',
        'Marketeurs digitaux',
        'E-commerçants',
        'Créateurs de contenu'
      ];
      for (const nom of defaultAudiences) {
        const existing = await getAudienceByName(nom);
        if (!existing) await createAudience({ nom });
      }

      return { success: true, message: "Données par défaut initialisées" };
    }),
  }),
});

export type AppRouter = typeof appRouter;
