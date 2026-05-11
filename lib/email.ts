import nodemailer from "nodemailer";
import { LabRequest } from "@/types";
import { format } from "date-fns";

function createTransport() {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: parseInt(process.env.EMAIL_PORT || "587"),
    secure: process.env.EMAIL_SECURE === "true",
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });
}

function fmt12(t: string) {
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

function fmtDate(d: string) {
  const [y, mo, day] = d.split("-").map(Number);
  return format(new Date(y, mo - 1, day), "EEEE, MMMM d, yyyy");
}

export async function sendLabRequestEmail(request: LabRequest): Promise<void> {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn("[Email] Credentials not set - skipping email.");
    return;
  }

  const to = process.env.NOTIFICATION_EMAIL || "dnadar@hawk.illinoistech.edu";
  const submittedAt = format(new Date(request.createdAt), "MMMM d, yyyy 'at' h:mm a");

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0d0d0d;color:#e8e8e8;margin:0;padding:0}
  .wrap{max-width:580px;margin:0 auto;padding:32px 20px}
  .hdr{background:linear-gradient(135deg,#1a0303,#3d0808);border:1px solid #c80d0d55;border-radius:14px;padding:28px;margin-bottom:20px}
  .hdr h1{margin:0 0 4px;font-size:20px;color:#ff6b6b;letter-spacing:-.3px}
  .hdr p{margin:0;color:#777;font-size:13px}
  .sec{background:#141414;border:1px solid #222;border-radius:10px;padding:18px;margin-bottom:14px}
  .sec h2{margin:0 0 12px;font-size:11px;text-transform:uppercase;letter-spacing:.1em;color:#666}
  .row{display:flex;justify-content:space-between;align-items:flex-start;padding:7px 0;border-bottom:1px solid #1e1e1e}
  .row:last-child{border:none}
  .l{color:#666;font-size:14px;flex-shrink:0;padding-right:12px}
  .v{color:#e8e8e8;font-size:14px;font-weight:500;text-align:right}
  .ft{text-align:center;color:#3a3a3a;font-size:11px;margin-top:20px}
  </style></head><body><div class="wrap">
  <div class="hdr"><h1>⚡ New Lab Opening Request</h1><p>Elevate Underground Lab Access System</p></div>
  <div class="sec"><h2>Requester</h2>
    <div class="row"><span class="l">Name</span><span class="v">${request.name}</span></div>
    ${request.email ? `<div class="row"><span class="l">Email</span><span class="v">${request.email}</span></div>` : ""}
  </div>
  <div class="sec"><h2>Schedule</h2>
    <div class="row"><span class="l">Date</span><span class="v">${fmtDate(request.date)}</span></div>
    <div class="row"><span class="l">Opening Time</span><span class="v">${fmt12(request.startTime)}</span></div>
    <div class="row"><span class="l">Expected Close</span><span class="v">${fmt12(request.endTime)}</span></div>
  </div>
  ${request.projectPurpose || request.tools || request.peopleCount ? `<div class="sec"><h2>Project</h2>
    ${request.projectPurpose ? `<div class="row"><span class="l">Purpose</span><span class="v">${request.projectPurpose}</span></div>` : ""}
    ${request.tools ? `<div class="row"><span class="l">Tools</span><span class="v">${request.tools}</span></div>` : ""}
    ${request.peopleCount ? `<div class="row"><span class="l">Headcount</span><span class="v">${request.peopleCount}</span></div>` : ""}
    ${request.uses3DPrinter !== undefined ? `<div class="row"><span class="l">3D Printer</span><span class="v">${request.uses3DPrinter ? "Yes" : "No"}</span></div>` : ""}
    ${request.specialEquipment ? `<div class="row"><span class="l">Special Equipment</span><span class="v">${request.specialEquipment}</span></div>` : ""}
  </div>` : ""}
  ${request.notes ? `<div class="sec"><h2>Notes</h2><p style="margin:0;color:#999;font-size:14px;line-height:1.6">${request.notes}</p></div>` : ""}
  <div class="ft">Submitted ${submittedAt} · Elevate Underground Lab Access</div>
  </div></body></html>`;

  const text = `New Lab Opening Request\n\nName: ${request.name}\n${request.email ? `Email: ${request.email}\n` : ""}Date: ${fmtDate(request.date)}\nOpening: ${fmt12(request.startTime)}\nClose: ${fmt12(request.endTime)}\n${request.projectPurpose ? `Purpose: ${request.projectPurpose}\n` : ""}${request.tools ? `Tools: ${request.tools}\n` : ""}\nSubmitted: ${submittedAt}`;

  await createTransport().sendMail({
    from: `"Elevate Underground Lab" <${process.env.EMAIL_USER}>`,
    to,
    subject: "New Elevate Underground Lab Opening Request",
    text,
    html,
  });

  console.log(`[Email] Sent to ${to}`);
}
