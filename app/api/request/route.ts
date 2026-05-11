import { NextRequest, NextResponse } from "next/server";
import { addRequest, getAllRequests } from "@/lib/queries";
import { sendLabRequestEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, date, startTime, endTime } = body;
    if (!name || !date || !startTime || !endTime)
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    if (endTime <= startTime)
      return NextResponse.json({ success: false, error: "End time must be after start time" }, { status: 400 });
    if (new Date(`${date}T${startTime}`) < new Date())
      return NextResponse.json({ success: false, error: "Cannot request access in the past" }, { status: 400 });

    const newReq = await addRequest({
      name: body.name, email: body.email, date: body.date,
      startTime: body.startTime, endTime: body.endTime,
      projectPurpose: body.projectPurpose, tools: body.tools,
      peopleCount: body.peopleCount ? parseInt(body.peopleCount) : undefined,
      uses3DPrinter: body.uses3DPrinter, safetyTraining: body.safetyTraining,
      specialEquipment: body.specialEquipment, notes: body.notes,
    });

    sendLabRequestEmail(newReq).catch((e) => console.error("[Email]", e));
    return NextResponse.json({ success: true, data: newReq }, { status: 201 });
  } catch (e: any) {
    console.error("[API /request]", e);
    return NextResponse.json({ success: false, error: e.message || "Server error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    return NextResponse.json({ success: true, data: await getAllRequests() });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
