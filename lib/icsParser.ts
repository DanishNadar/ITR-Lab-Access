import { CalendarEvent, AvailabilityBlock } from "@/types";

export function parseICS(icsText: string): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const blocks = icsText.match(/BEGIN:VEVENT[\s\S]*?END:VEVENT/g) || [];

  for (const block of blocks) {
    const summary = field(block, "SUMMARY") || "Busy";
    const dtstart = dateField(block, "DTSTART");
    const dtend = dateField(block, "DTEND");
    const uid = field(block, "UID") || undefined;
    if (!dtstart || !dtend) continue;
    events.push({ summary, start: dtstart, end: dtend, uid });
  }

  return events.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
}

function field(block: string, name: string): string | null {
  const m = block.match(new RegExp(`${name}(?:;[^:]*)?:([^\r\n]+)`));
  return m ? m[1].trim() : null;
}

function dateField(block: string, name: string): string | null {
  const raw = field(block, name);
  return raw ? icsDateToISO(raw) : null;
}

function icsDateToISO(raw: string): string {
  if (/^\d{8}$/.test(raw)) {
    return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}T00:00:00.000Z`;
  }
  if (/^\d{8}T\d{6}Z?$/.test(raw)) {
    const y = raw.slice(0, 4), mo = raw.slice(4, 6), d = raw.slice(6, 8);
    const h = raw.slice(9, 11), mi = raw.slice(11, 13), s = raw.slice(13, 15);
    return `${y}-${mo}-${d}T${h}:${mi}:${s}${raw.endsWith("Z") ? ".000Z" : ".000"}`;
  }
  return new Date(raw).toISOString();
}

export function computeAvailability(
  events: CalendarEvent[],
  rangeStart: Date,
  rangeEnd: Date,
  personName: string,
  minMinutes = 30
): AvailabilityBlock[] {
  const busy = events
    .filter((e) => new Date(e.end) > rangeStart && new Date(e.start) < rangeEnd)
    .map((e) => ({
      start: new Date(Math.max(new Date(e.start).getTime(), rangeStart.getTime())),
      end: new Date(Math.min(new Date(e.end).getTime(), rangeEnd.getTime())),
    }))
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  const merged: { start: Date; end: Date }[] = [];
  for (const s of busy) {
    if (!merged.length || s.start > merged.at(-1)!.end) merged.push({ ...s });
    else merged.at(-1)!.end = new Date(Math.max(s.end.getTime(), merged.at(-1)!.end.getTime()));
  }

  const avail: AvailabilityBlock[] = [];
  let cursor = rangeStart;
  for (const b of merged) {
    if (b.start > cursor && b.start.getTime() - cursor.getTime() >= minMinutes * 60000) {
      avail.push({ personName, start: cursor.toISOString(), end: b.start.toISOString() });
    }
    if (b.end > cursor) cursor = b.end;
  }
  if (cursor < rangeEnd && rangeEnd.getTime() - cursor.getTime() >= minMinutes * 60000) {
    avail.push({ personName, start: cursor.toISOString(), end: rangeEnd.toISOString() });
  }
  return avail;
}
