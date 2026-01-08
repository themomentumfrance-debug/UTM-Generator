import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Table des réseaux sociaux
 * Les réseaux système (userId = null) sont visibles par tous
 * Les réseaux personnalisés (userId != null) sont privés
 */
export const socials = mysqlTable("socials", {
  id: int("id").autoincrement().primaryKey(),
  nom: varchar("nom", { length: 100 }).notNull(),
  userId: int("user_id"), // null = système (visible par tous), sinon = privé
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Social = typeof socials.$inferSelect;
export type InsertSocial = typeof socials.$inferInsert;

/**
 * Table des types de contenu
 * Les types système (userId = null) sont visibles par tous
 * Les types personnalisés (userId != null) sont privés
 */
export const contentTypes = mysqlTable("content_types", {
  id: int("id").autoincrement().primaryKey(),
  nom: varchar("nom", { length: 100 }).notNull(),
  userId: int("user_id"), // null = système (visible par tous), sinon = privé
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ContentType = typeof contentTypes.$inferSelect;
export type InsertContentType = typeof contentTypes.$inferInsert;

/**
 * Table des objectifs de publication
 * Les objectifs système (userId = null) sont visibles par tous
 * Les objectifs personnalisés (userId != null) sont privés
 */
export const objectives = mysqlTable("objectives", {
  id: int("id").autoincrement().primaryKey(),
  nom: varchar("nom", { length: 100 }).notNull(),
  userId: int("user_id"), // null = système (visible par tous), sinon = privé
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Objective = typeof objectives.$inferSelect;
export type InsertObjective = typeof objectives.$inferInsert;

/**
 * Table des canaux/chaînes
 * Chaque canal appartient à un utilisateur spécifique
 */
export const channels = mysqlTable("channels", {
  id: int("id").autoincrement().primaryKey(),
  nom: varchar("nom", { length: 255 }).notNull(),
  lien: text("lien"),
  userId: int("user_id"), // Propriétaire du canal
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Channel = typeof channels.$inferSelect;
export type InsertChannel = typeof channels.$inferInsert;

/**
 * Table des audiences ciblées
 * Les audiences système (userId = null) sont visibles par tous
 * Les audiences personnalisées (userId != null) sont privées
 */
export const audiences = mysqlTable("audiences", {
  id: int("id").autoincrement().primaryKey(),
  nom: varchar("nom", { length: 255 }).notNull(),
  description: text("description"),
  userId: int("user_id"), // null = système (visible par tous), sinon = privé
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Audience = typeof audiences.$inferSelect;
export type InsertAudience = typeof audiences.$inferInsert;

/**
 * Table principale des liens UTM
 * Chaque lien appartient à un utilisateur spécifique
 */
export const utmLinks = mysqlTable("utm_links", {
  id: int("id").autoincrement().primaryKey(),
  destinationUrl: text("destination_url").notNull(),
  socialId: int("social_id").notNull(),
  contentTypeId: int("content_type_id").notNull(),
  channelId: int("channel_id"),
  objectifId: int("objectif_id").notNull(),
  audienceId: int("audience_id"),
  
  // Paramètres UTM
  utmSource: varchar("utm_source", { length: 255 }).notNull(),
  utmMedium: varchar("utm_medium", { length: 255 }).notNull(),
  utmCampaign: varchar("utm_campaign", { length: 255 }).notNull(),
  utmTerm: varchar("utm_term", { length: 255 }),
  utmContent: varchar("utm_content", { length: 255 }),
  
  // Lien UTM généré
  generatedUrl: text("generated_url").notNull(),
  
  // Raccourcisseur de liens
  slug: varchar("slug", { length: 20 }).unique(),
  shortUrl: text("short_url"),
  
  // Informations marketing
  angleMarketing: text("angle_marketing"),
  hook: text("hook"),
  audienceCible: text("audience_cible"),
  budget: varchar("budget", { length: 100 }),
  
  // Tracking des clics
  clickCount: int("click_count").default(0),
  
  // Propriétaire du lien (isolation des données)
  userId: int("user_id").notNull(),
  
  // Métadonnées
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  createdBy: int("created_by"),
});

export type UtmLink = typeof utmLinks.$inferSelect;
export type InsertUtmLink = typeof utmLinks.$inferInsert;

/**
 * Table des images de publication (stockées sur S3)
 */
export const publicationImages = mysqlTable("publication_images", {
  id: int("id").autoincrement().primaryKey(),
  utmLinkId: int("utm_link_id").notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileKey: varchar("file_key", { length: 500 }).notNull(),
  url: text("url").notNull(),
  mimeType: varchar("mime_type", { length: 100 }),
  fileSize: int("file_size"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PublicationImage = typeof publicationImages.$inferSelect;
export type InsertPublicationImage = typeof publicationImages.$inferInsert;

/**
 * Table pour l'historique de synchronisation Google Drive
 */
export const gdriveSync = mysqlTable("gdrive_sync", {
  id: int("id").autoincrement().primaryKey(),
  tableName: varchar("table_name", { length: 100 }).notNull(),
  lastSyncAt: timestamp("last_sync_at").defaultNow().notNull(),
  recordCount: int("record_count").default(0),
  status: varchar("status", { length: 50 }).default("success"),
  errorMessage: text("error_message"),
});

export type GdriveSync = typeof gdriveSync.$inferSelect;
export type InsertGdriveSync = typeof gdriveSync.$inferInsert;

/**
 * Table des événements de clics pour le tracking type Bitly
 * Enregistre chaque clic sur un lien raccourci avec métadonnées
 */
export const clickEvents = mysqlTable("click_events", {
  id: int("id").autoincrement().primaryKey(),
  utmLinkId: int("utm_link_id").notNull(),
  clickedAt: timestamp("clicked_at").defaultNow().notNull(),
  
  // Géolocalisation
  country: varchar("country", { length: 100 }),
  countryCode: varchar("country_code", { length: 10 }),
  city: varchar("city", { length: 100 }),
  region: varchar("region", { length: 100 }),
  
  // Informations appareil
  deviceType: varchar("device_type", { length: 50 }), // mobile, desktop, tablet
  browser: varchar("browser", { length: 100 }),
  browserVersion: varchar("browser_version", { length: 50 }),
  os: varchar("os", { length: 100 }),
  osVersion: varchar("os_version", { length: 50 }),
  
  // Informations de référence
  referer: text("referer"),
  userAgent: text("user_agent"),
  ipAddress: varchar("ip_address", { length: 45 }),
  
  // Plateforme d'origine (Direct, Social, Search, etc.)
  platform: varchar("platform", { length: 100 }),
});

export type ClickEvent = typeof clickEvents.$inferSelect;
export type InsertClickEvent = typeof clickEvents.$inferInsert;
