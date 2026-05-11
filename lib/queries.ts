/**
 * All database queries live here.
 *
 * When DATABASE_URL is set, data is persisted to Neon Postgres via Drizzle ORM.
 * When DATABASE_URL is NOT set, an in-memory fallback is used automatically -
 * the app runs locally with sample data, no database setup required.
 *
 * The Neon client only opens a connection when a query is actually executed,
 * so importing this module is always safe even without DATABASE_URL.
 */

import { eq, gte, lt, desc, asc } from "drizzle-orm";
import { getDb, schema } from "./db";
import type { LabRequestRow, LabStatusRow, CalendarRow } from "./schema";
import { LabRequest, LabStatus, AvailabilityCalendar } from "@/types";

const HAS_DB = !!process.env.DATABASE_URL;

// ─────────────────────────────────────────────────────────────────────────────
// ROW → APP TYPE CONVERTERS
// ─────────────────────────────────────────────────────────────────────────────

function toReq(r: LabRequestRow): LabRequest {
  return {
    ...r,
    createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
    uses3DPrinter: r.uses3DPrinter ?? undefined,
    safetyTraining: r.safetyTraining ?? undefined,
  };
}

function toStatus(r: LabStatusRow): LabStatus {
  return {
    ...r,
    updatedAt: r.updatedAt instanceof Date ? r.updatedAt.toISOString() : String(r.updatedAt),
    formallyClosedAt: r.formallyClosedAt
      ? r.formallyClosedAt instanceof Date
        ? r.formallyClosedAt.toISOString()
        : String(r.formallyClosedAt)
      : undefined,
  };
}

function toCal(r: CalendarRow): AvailabilityCalendar {
  return {
    ...r,
    events: (r.events as AvailabilityCalendar["events"]) ?? [],
    createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// IN-MEMORY SAMPLE DATA (active when DATABASE_URL is not set)
// ─────────────────────────────────────────────────────────────────────────────

let _memStatus: LabStatus = {
  id: "singleton", currentState: "closed",
  updatedAt: new Date().toISOString(), updatedBy: "system",
  notes: "Lab is closed. Submit a request to schedule access.",
};

let _memRequests: LabRequest[] = [];

let _memCalendars: AvailabilityCalendar[] = [];

// ─────────────────────────────────────────────────────────────────────────────
// LAB STATUS
// ─────────────────────────────────────────────────────────────────────────────

export async function getLabStatus(): Promise<LabStatus> {
  if (!HAS_DB) return { ..._memStatus };

  const db = getDb();
  const rows = await db
    .select().from(schema.labStatus)
    .where(eq(schema.labStatus.id, "singleton")).limit(1);

  if (!rows.length) {
    const ins = await db.insert(schema.labStatus)
      .values({ id:"singleton", currentState:"closed", updatedBy:"system", notes:"Lab is closed." })
      .returning();
    return toStatus(ins[0]);
  }
  return toStatus(rows[0]);
}

export async function setLabStatus(update: Partial<Omit<LabStatus, "id">>): Promise<LabStatus> {
  if (!HAS_DB) {
    _memStatus = { ..._memStatus, ...update, id:"singleton", updatedAt:new Date().toISOString() };
    return { ..._memStatus };
  }

  const db = getDb();
  const v = {
    id: "singleton" as const,
    currentState: (update.currentState ?? "closed") as "open"|"closed"|"limbo",
    updatedBy: update.updatedBy ?? "system",
    updatedAt: new Date(),
    responsiblePerson: update.responsiblePerson ?? null,
    notes: update.notes ?? null,
    formallyClosedAt: update.formallyClosedAt ? new Date(update.formallyClosedAt) : null,
  };
  const r = await db.insert(schema.labStatus).values(v)
    .onConflictDoUpdate({ target: schema.labStatus.id, set: v })
    .returning();
  return toStatus(r[0]);
}

// ─────────────────────────────────────────────────────────────────────────────
// LAB REQUESTS
// ─────────────────────────────────────────────────────────────────────────────

export async function getAllRequests(): Promise<LabRequest[]> {
  if (!HAS_DB)
    return [..._memRequests].sort((a,b)=>new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime());

  const db = getDb();
  return (await db.select().from(schema.labRequests).orderBy(desc(schema.labRequests.createdAt))).map(toReq);
}

export async function getUpcomingRequests(): Promise<LabRequest[]> {
  const now = new Date();

  if (!HAS_DB)
    return _memRequests
      .filter(r => new Date(`${r.date}T${r.startTime}`) >= now && r.status !== "cancelled")
      .sort((a,b)=>new Date(`${a.date}T${a.startTime}`).getTime()-new Date(`${b.date}T${b.startTime}`).getTime());

  const db = getDb();
  const todayStr = now.toISOString().split("T")[0];
  const rows = await db.select().from(schema.labRequests)
    .where(gte(schema.labRequests.date, todayStr))
    .orderBy(asc(schema.labRequests.date), asc(schema.labRequests.startTime));

  return rows
    .filter((r: LabRequestRow) => new Date(`${r.date}T${r.startTime}`) >= now && r.status !== "cancelled")
    .map(toReq);
}

export async function getPastRequests(): Promise<LabRequest[]> {
  const now = new Date();

  if (!HAS_DB)
    return _memRequests
      .filter(r => new Date(`${r.date}T${r.endTime}`) < now)
      .sort((a,b)=>new Date(`${b.date}T${b.startTime}`).getTime()-new Date(`${a.date}T${a.startTime}`).getTime());

  const db = getDb();
  const todayStr = now.toISOString().split("T")[0];
  return (await db.select().from(schema.labRequests)
    .where(lt(schema.labRequests.date, todayStr))
    .orderBy(desc(schema.labRequests.date), desc(schema.labRequests.startTime))
  ).map(toReq);
}

export async function addRequest(req: Omit<LabRequest,"id"|"createdAt"|"status">): Promise<LabRequest> {
  const id = `req_${Date.now()}_${Math.random().toString(36).slice(2,7)}`;

  if (!HAS_DB) {
    const r: LabRequest = { ...req, id, createdAt:new Date().toISOString(), status:"pending" };
    _memRequests.push(r);
    return r;
  }

  const db = getDb();
  const ins = await db.insert(schema.labRequests).values({
    id, name:req.name, email:req.email??null, date:req.date,
    startTime:req.startTime, endTime:req.endTime,
    projectPurpose:req.projectPurpose??null, tools:req.tools??null,
    peopleCount:req.peopleCount??null, uses3DPrinter:req.uses3DPrinter??false,
    safetyTraining:req.safetyTraining??false, specialEquipment:req.specialEquipment??null,
    notes:req.notes??null, status:"pending",
  }).returning();
  return toReq(ins[0]);
}

export async function updateRequestStatus(id: string, status: LabRequest["status"]): Promise<LabRequest|null> {
  if (!HAS_DB) {
    const i = _memRequests.findIndex(r=>r.id===id);
    if (i===-1) return null;
    _memRequests[i] = { ..._memRequests[i], status };
    return _memRequests[i];
  }

  const db = getDb();
  const r = await db.update(schema.labRequests).set({status}).where(eq(schema.labRequests.id,id)).returning();
  return r[0] ? toReq(r[0]) : null;
}

// ─────────────────────────────────────────────────────────────────────────────
// AVAILABILITY CALENDARS
// ─────────────────────────────────────────────────────────────────────────────

export async function getCalendars(): Promise<AvailabilityCalendar[]> {
  if (!HAS_DB) return [..._memCalendars];

  const db = getDb();
  return (await db.select().from(schema.availabilityCalendars)
    .orderBy(asc(schema.availabilityCalendars.personName))
  ).map(toCal);
}

export async function upsertCalendar(cal: Omit<AvailabilityCalendar,"createdAt">): Promise<void> {
  if (!HAS_DB) {
    const full: AvailabilityCalendar = { ...cal, createdAt:new Date().toISOString() };
    const i = _memCalendars.findIndex(c=>c.personName===cal.personName);
    if (i!==-1) _memCalendars[i]=full; else _memCalendars.push(full);
    return;
  }

  const db = getDb();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const eventsJson = cal.events as any;
  await db.insert(schema.availabilityCalendars)
    .values({ id:cal.id, personName:cal.personName, uploadedFileName:cal.uploadedFileName, events:eventsJson })
    .onConflictDoUpdate({
      target: schema.availabilityCalendars.personName,
      set: { uploadedFileName:cal.uploadedFileName, events:eventsJson, createdAt:new Date() },
    });
}

export async function removeCalendar(id: string): Promise<void> {
  if (!HAS_DB) { _memCalendars = _memCalendars.filter(c=>c.id!==id); return; }

  const db = getDb();
  await db.delete(schema.availabilityCalendars).where(eq(schema.availabilityCalendars.id,id));
}
