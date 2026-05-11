"use client";

import { LabStatus, LabRequest } from "@/types";
import { LAB_STATE_CONFIG } from "@/lib/labStatus";
import { format } from "date-fns";

interface Props {
  status: LabStatus;
  nextRequest?: LabRequest | null;
}

function fmt12(t: string) {
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2,"0")} ${h >= 12 ? "PM" : "AM"}`;
}
function fmtDate(d: string) {
  const [y,mo,day] = d.split("-").map(Number);
  return format(new Date(y,mo-1,day), "EEE, MMM d");
}
function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff/60000), h = Math.floor(m/60);
  if (m < 2) return "just now";
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  return format(new Date(iso), "MMM d");
}

export default function LabStatusCard({ status, nextRequest }: Props) {
  const cfg = LAB_STATE_CONFIG[status.currentState];
  return (
    <div className={`card p-6 ${cfg.bgColor} border ${cfg.borderColor}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <div className={`status-dot ${status.currentState} ${status.currentState === "open" ? "anim-pulse-open" : ""}`} />
            <span className={`text-3xl font-bold tracking-wide ${cfg.color}`} style={{fontFamily:"var(--font-display)",letterSpacing:".06em"}}>
              {cfg.label.toUpperCase()}
            </span>
            <span className="text-[12px] text-[#444] font-mono">{timeAgo(status.updatedAt)}</span>
          </div>
          <p className="text-[15px] text-[#999] leading-relaxed mb-3">
            {status.notes || cfg.description}
          </p>
          <div className="flex flex-wrap gap-4 text-[13px] text-[#666]">
            {status.responsiblePerson && (
              <span>Responsible: <span className="text-[#bbb]">{status.responsiblePerson}</span></span>
            )}
            <span>Updated by: <span className="text-[#bbb]">{status.updatedBy}</span></span>
          </div>
        </div>
        <span className="text-5xl select-none opacity-50 shrink-0 hidden sm:block">{cfg.emoji}</span>
      </div>

      {nextRequest && status.currentState !== "open" && (
        <div className="mt-5 pt-5 border-t border-white/5">
          <p className="text-[11px] uppercase tracking-widest text-[#444] mb-2">Next Scheduled Opening</p>
          <div className="flex flex-wrap items-center gap-3 text-[15px]">
            <span className="font-semibold text-[#e8e8e8]">{fmtDate(nextRequest.date)}</span>
            <span className="text-[#777]">{fmt12(nextRequest.startTime)} – {fmt12(nextRequest.endTime)}</span>
            <span className="text-[#555]">by {nextRequest.name}</span>
            {nextRequest.projectPurpose && <span className="text-[#444]">· {nextRequest.projectPurpose}</span>}
          </div>
        </div>
      )}
    </div>
  );
}
