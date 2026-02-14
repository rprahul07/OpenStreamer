import { sql } from "drizzle-orm";
import { pgTable, text, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name").notNull(),
  role: text("role").notNull().default("listener"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  displayName: true,
  role: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Track schema
export const tracks = pgTable("tracks", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  artist: text("artist").notNull(),
  album: text("album"),
  duration: text("duration").notNull(),
  fileUrl: text("file_url").notNull(),
  coverUrl: text("cover_url"),
  uploadedBy: text("uploaded_by").notNull(),
  isPublic: text("is_public", { enum: ["true", "false"] }).default("true"),
  playCount: text("play_count").default("0"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const insertTrackSchema = createInsertSchema(tracks).pick({
  title: true,
  artist: true,
  album: true,
  duration: true,
  fileUrl: true,
  coverUrl: true,
  uploadedBy: true,
  isPublic: true,
});

export type InsertTrack = z.infer<typeof insertTrackSchema>;
export type Track = typeof tracks.$inferSelect;

// Playlist schema
export const playlists = pgTable("playlists", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  userId: text("user_id").notNull(),
  isPublic: text("is_public", { enum: ["true", "false"] }).default("false"),
  coverUrl: text("cover_url"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const insertPlaylistSchema = createInsertSchema(playlists).pick({
  name: true,
  description: true,
  userId: true,
  isPublic: true,
  coverUrl: true,
});

export type InsertPlaylist = z.infer<typeof insertPlaylistSchema>;
export type Playlist = typeof playlists.$inferSelect;

// Playlist Track schema
export const playlistTracks = pgTable("playlist_tracks", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  playlistId: text("playlist_id").notNull(),
  trackId: text("track_id").notNull(),
  position: text("position").notNull(),
  addedAt: text("added_at").default(sql`CURRENT_TIMESTAMP`),
});

export const insertPlaylistTrackSchema = createInsertSchema(playlistTracks).pick({
  playlistId: true,
  trackId: true,
  position: true,
});

export type InsertPlaylistTrack = z.infer<typeof insertPlaylistTrackSchema>;
export type PlaylistTrack = typeof playlistTracks.$inferSelect;

// User Branding Settings schema
export const userBrandingSettings = pgTable("user_branding_settings", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull().unique(),
  appName: text("app_name").default("Academic Audio Platform"),
  appLogoUrl: text("app_logo_url"),
  appIconUrl: text("app_icon_url"),
  splashScreenUrl: text("splash_screen_url"),
  primaryColor: text("primary_color").default("#4F46E5"),
  secondaryColor: text("secondary_color").default("#10B981"),
  accentColor: text("accent_color").default("#F59E0B"),
  backgroundColor: text("background_color").default("#FFFFFF"),
  textColor: text("text_color").default("#1F2937"),
  themeMode: text("theme_mode", { enum: ["light", "dark", "auto"] }).default("light"),
  fontFamily: text("font_family"),
  customCss: text("custom_css"),
  footerText: text("footer_text").default("2024 Academic Audio Platform"),
  contactEmail: text("contact_email"),
  socialLinks: text("social_links"), // JSON string
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const insertUserBrandingSettingsSchema = createInsertSchema(userBrandingSettings).pick({
  userId: true,
  appName: true,
  appLogoUrl: true,
  appIconUrl: true,
  splashScreenUrl: true,
  primaryColor: true,
  secondaryColor: true,
  accentColor: true,
  backgroundColor: true,
  textColor: true,
  themeMode: true,
  fontFamily: true,
  customCss: true,
  footerText: true,
  contactEmail: true,
  socialLinks: true,
});

export type InsertUserBrandingSettings = z.infer<typeof insertUserBrandingSettingsSchema>;
export type UserBrandingSettings = typeof userBrandingSettings.$inferSelect;
