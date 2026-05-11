import { NextRequest, NextResponse } from "next/server";
import { verifyAdminPassword } from "@/lib/labStatus";
import { upsertCalendar, getCalendars, removeCalendar } from "@/lib/queries";
import { parseICS } from "@/lib/icsParser";

export async function POST(req: NextRequest) {
  const fd = await req.formData();
  const password = fd.get("password") as string;
  const personName = fd.get("personName") as string;
  const file = fd.get("file") as File;

  if (!verifyAdminPassword(password)) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  if (!personName || !file) return NextResponse.json({ success: false, error: "personName and file required" }, { status: 400 });
  if (!file.name.endsWith(".ics")) return NextResponse.json({ success: false, error: "Only .ics files supported" }, { status: 400 });

  try {
    const events = parseICS(await file.text());
    await upsertCalendar({
      id: `cal_${Date.now()}`,
      personName, uploadedFileName: file.name, events,
    });
    return NextResponse.json({ success: true, data: { personName, eventCount: events.length } });
  } catch (err) {
    console.error("[POST /api/calendars]", err);
    return NextResponse.json({ success: false, error: "Failed to save calendar" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const pw = req.headers.get("x-admin-password");
  if (!pw || !verifyAdminPassword(pw)) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ success: true, data: await getCalendars() });
}

export async function DELETE(req: NextRequest) {
  const { id, password } = await req.json();
  if (!verifyAdminPassword(password)) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  await removeCalendar(id);
  return NextResponse.json({ success: true });
}
