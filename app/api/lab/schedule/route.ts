import { NextResponse } from "next/server";
import { getUpcomingRequests, getCalendars, getLabStatus } from "@/lib/queries";
import { computeAvailability } from "@/lib/icsParser";
import { ScheduleBlock } from "@/types";
import { addDays, startOfDay, endOfDay } from "date-fns";

export async function GET() {
  const [requests, calendars, status] = await Promise.all([
    getUpcomingRequests(), getCalendars(), getLabStatus(),
  ]);

  const blocks: ScheduleBlock[] = requests.map((r) => ({
    id: `req-${r.id}`,
    type: "request",
    start: `${r.date}T${r.startTime}:00`,
    end: `${r.date}T${r.endTime}:00`,
    label: r.name,
    peopleInvolved: [r.name],
    notes: r.projectPurpose,
  }));

  const now = new Date();
  for (const cal of calendars) {
    const avail = computeAvailability(cal.events as any, startOfDay(now), endOfDay(addDays(now, 14)), cal.personName);
    for (const a of avail) {
      blocks.push({
        id: `avail-${cal.id}-${a.start}`,
        type: "availability",
        start: a.start, end: a.end,
        label: `${a.personName} available`,
        peopleInvolved: [a.personName],
      });
    }
  }

  return NextResponse.json({
    success: true,
    data: {
      blocks: blocks.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()),
      currentStatus: status,
    },
  });
}
