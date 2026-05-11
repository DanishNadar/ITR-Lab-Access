import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  pgEnum,
  jsonb,
} from "drizzle-orm/pg-core";

// ---- Enums ----
export const labStateEnum = pgEnum("lab_state", ["open", "closed", "limbo"]);
export const requestStatusEnum = pgEnum("request_status", [
  "pending",
  "approved",
  "completed",
  "cancelled",
]);

// ---- lab_requests ----
export const labRequests = pgTable("lab_requests", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  date: text("date").notNull(), // YYYY-MM-DD
  startTime: text("start_time").notNull(), // HH:MM
  endTime: text("end_time").notNull(),
  projectPurpose: text("project_purpose"),
  tools: text("tools"),
  peopleCount: integer("people_count"),
  uses3DPrinter: boolean("uses_3d_printer").default(false),
  safetyTraining: boolean("safety_training").default(false),
  specialEquipment: text("special_equipment"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  status: requestStatusEnum("status").default("pending").notNull(),
});

// ---- lab_status ----
// Single row - the current state of the lab
export const labStatus = pgTable("lab_status", {
  id: text("id").primaryKey().default("singleton"),
  currentState: labStateEnum("current_state").default("closed").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  updatedBy: text("updated_by").default("system").notNull(),
  responsiblePerson: text("responsible_person"),
  notes: text("notes"),
  formallyClosedAt: timestamp("formally_closed_at", { withTimezone: true }),
});

// ---- availability_calendars ----
export const availabilityCalendars = pgTable("availability_calendars", {
  id: text("id").primaryKey(),
  personName: text("person_name").notNull().unique(),
  uploadedFileName: text("uploaded_file_name").notNull(),
  // Events stored as JSONB array of {summary, start, end, uid}
  events: jsonb("events").$type<{ summary: string; start: string; end: string; uid?: string }[]>().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Type exports for use throughout the app
export type LabRequestRow = typeof labRequests.$inferSelect;
export type LabStatusRow = typeof labStatus.$inferSelect;
export type CalendarRow = typeof availabilityCalendars.$inferSelect;
