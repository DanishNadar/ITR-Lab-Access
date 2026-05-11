import { LabRequest, LabStatus } from "@/types";
import { format } from "date-fns";

function fmt12(t: string) {
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

function fmtDate(d: string) {
  const [y, mo, day] = d.split("-").map(Number);
  return format(new Date(y, mo - 1, day), "EEEE, MMMM d, yyyy");
}

export async function sendLabRequestEmail(request: LabRequest): Promise<void> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn("[Discord] DISCORD_WEBHOOK_URL not set - skipping notification.");
    return;
  }

  const submittedAt = format(new Date(request.createdAt), "MMMM d, yyyy 'at' h:mm a");

  const fields = [
    { name: "Date", value: fmtDate(request.date), inline: true },
    { name: "Time", value: `${fmt12(request.startTime)} – ${fmt12(request.endTime)}`, inline: true },
    ...(request.email ? [{ name: "Email", value: request.email, inline: false }] : []),
    ...(request.projectPurpose ? [{ name: "Purpose", value: request.projectPurpose, inline: false }] : []),
    ...(request.tools ? [{ name: "Tools", value: request.tools, inline: false }] : []),
    ...(request.peopleCount ? [{ name: "Headcount", value: String(request.peopleCount), inline: true }] : []),
    ...(request.uses3DPrinter !== undefined ? [{ name: "3D Printer", value: request.uses3DPrinter ? "Yes" : "No", inline: true }] : []),
    ...(request.specialEquipment ? [{ name: "Special Equipment", value: request.specialEquipment, inline: false }] : []),
    ...(request.notes ? [{ name: "Notes", value: request.notes, inline: false }] : []),
  ];

  const body = {
    username: "Elevate Underground Lab",
    embeds: [{
      title: "New Lab Opening Request",
      color: 0xc80d0d,
      fields: [
        { name: "Requester", value: request.name, inline: false },
        ...fields,
      ],
      footer: { text: `Submitted ${submittedAt}` },
    }],
  };

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Discord webhook failed: ${res.status} ${text}`);
  }

  console.log("[Discord] Notification sent.");
}

const STATE_META: Record<string, { color: number; emoji: string; title: string }> = {
  open:   { color: 0x34d399, emoji: "🟢", title: "Lab is Now Open"   },
  closed: { color: 0xef4444, emoji: "🔴", title: "Lab is Now Closed" },
  limbo:  { color: 0xfbbf24, emoji: "🟡", title: "Lab is in Limbo"   },
};

export async function sendLabStatusNotification(status: LabStatus): Promise<void> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn("[Discord] DISCORD_WEBHOOK_URL not set - skipping status notification.");
    return;
  }

  const meta = STATE_META[status.currentState] ?? STATE_META.limbo;
  const updatedAt = format(new Date(status.updatedAt), "MMMM d, yyyy 'at' h:mm a");

  const fields = [
    { name: "Updated by", value: status.updatedBy, inline: true },
    { name: "Time", value: updatedAt, inline: true },
    ...(status.responsiblePerson
      ? [{ name: "Responsible Person", value: status.responsiblePerson, inline: false }]
      : []),
    ...(status.notes
      ? [{ name: "Notes", value: status.notes, inline: false }]
      : []),
    ...(status.currentState === "limbo" && !status.responsiblePerson
      ? [{ name: "⚠️ Action Required", value: "No responsible person assigned. Someone must formally close the lab or take responsibility.", inline: false }]
      : []),
  ];

  const body = {
    username: "Elevate Underground Lab",
    embeds: [{
      title: `${meta.emoji} ${meta.title}`,
      color: meta.color,
      fields,
      footer: { text: "Elevate Underground Lab Access System" },
    }],
  };

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Discord webhook failed: ${res.status} ${text}`);
  }

  console.log(`[Discord] Lab status notification sent: ${status.currentState}`);
}
