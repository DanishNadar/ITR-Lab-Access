import { NextRequest, NextResponse } from "next/server";
import { verifyAdminPassword } from "@/lib/labStatus";
import { setLabStatus, getAllRequests, getUpcomingRequests, getPastRequests, updateRequestStatus } from "@/lib/queries";
import { LabState } from "@/types";

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!verifyAdminPassword(body.password))
    return NextResponse.json({ success: false, error: "Invalid admin password" }, { status: 401 });

  switch (body.action) {
    case "updateStatus": {
      if (!["open", "closed", "limbo"].includes(body.state))
        return NextResponse.json({ success: false, error: "Invalid state" }, { status: 400 });
      const updated = await setLabStatus({
        currentState: body.state as LabState,
        updatedBy: "admin",
        responsiblePerson: body.responsiblePerson ?? null,
        notes: body.notes ?? null,
        ...(body.state === "closed" ? { formallyClosedAt: new Date().toISOString() } : {}),
      });
      return NextResponse.json({ success: true, data: updated });
    }
    case "getRequests": {
      let data;
      if (body.filter === "upcoming") data = await getUpcomingRequests();
      else if (body.filter === "past") data = await getPastRequests();
      else data = await getAllRequests();
      return NextResponse.json({ success: true, data });
    }
    case "updateRequestStatus": {
      const updated = await updateRequestStatus(body.requestId, body.status);
      return NextResponse.json({ success: !!updated, data: updated });
    }
    default:
      return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });
  }
}
