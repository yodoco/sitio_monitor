import { pgTable, text, serial, integer, jsonb, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

export const siteSettings = pgTable("monitor_site_settings", {
  id: integer("id").primaryKey(),
  content: jsonb("content").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
export const adminAccess = pgTable("monitor_admin_access", {
  id: integer("id").primaryKey(),
  emails: text("emails").array().notNull(),
});
export const inquiries = pgTable("monitor_inquiries", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  company: text("company").notNull().default(""),
  email: text("email").notNull(),
  phone: text("phone").notNull().default(""),
  message: text("message").notNull(),
  kind: text("kind").notNull(),
  service: text("service").notNull().default(""),
  status: text("status").notNull().default("nuevo"),
  emailSent: boolean("email_sent").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
export const mediaUploads = pgTable("monitor_media_uploads", {
  objectPath: text("object_path").primaryKey(),
  name: text("name").notNull(),
  contentType: text("content_type").notNull(),
  size: integer("size").notNull(),
  ownerId: text("owner_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
export const insertInquirySchema = createInsertSchema(inquiries).omit({ id: true, createdAt: true });
export type InquiryRecord = typeof inquiries.$inferSelect;
