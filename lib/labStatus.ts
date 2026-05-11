import { LabState } from "@/types";

export const LAB_STATE_CONFIG: Record<LabState, {
  label: string; color: string; bgColor: string; borderColor: string;
  dotColor: string; description: string; emoji: string;
}> = {
  open: {
    label: "Open", color: "text-emerald-400", bgColor: "bg-emerald-950/40",
    borderColor: "border-emerald-700/50", dotColor: "bg-emerald-400",
    description: "The lab is currently open. A responsible person is present.",
    emoji: "🟢",
  },
  closed: {
    label: "Closed", color: "text-red-400", bgColor: "bg-red-950/30",
    borderColor: "border-red-800/40", dotColor: "bg-red-500",
    description: "The lab is formally closed. No one is present.",
    emoji: "🔴",
  },
  limbo: {
    label: "Limbo", color: "text-amber-400", bgColor: "bg-amber-950/30",
    borderColor: "border-amber-700/40", dotColor: "bg-amber-400",
    description: "Status unclear - the opener may have left but the lab hasn't been formally closed.",
    emoji: "🟡",
  },
};

export function verifyAdminPassword(password: string): boolean {
  const p = process.env.ADMIN_PASSWORD;
  if (!p) { console.warn("[Auth] ADMIN_PASSWORD not set"); return false; }
  return password === p;
}

export function verifyBotApiKey(key: string): boolean {
  const k = process.env.DISCORD_BOT_API_KEY;
  if (!k) return false;
  return key === k;
}
