import { NextRequest, NextResponse } from "next/server";
import { setLabStatus } from "@/lib/queries";
import { verifyBotApiKey, verifyAdminPassword } from "@/lib/labStatus";

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get("x-api-key") ?? req.headers.get("authorization")?.replace("Bearer ", "");
  const body = await req.json().catch(() => ({}));
  if (!( (apiKey && verifyBotApiKey(apiKey)) || (body.adminPassword && verifyAdminPassword(body.adminPassword)) ))
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const updated = await setLabStatus({
    currentState: "open", updatedBy: apiKey ? "discord-bot" : "admin",
    responsiblePerson: body.responsiblePerson ?? body.updatedBy ?? null,
    notes: body.notes ?? null,
  });
  return NextResponse.json({ success: true, data: updated });
}
