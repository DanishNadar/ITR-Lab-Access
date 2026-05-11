import { NextResponse } from "next/server";
import { getLabStatus, getUpcomingRequests } from "@/lib/queries";

export async function GET() {
  const [status, upcoming] = await Promise.all([getLabStatus(), getUpcomingRequests()]);
  return NextResponse.json({ success: true, data: { status, nextRequest: upcoming[0] ?? null } });
}
