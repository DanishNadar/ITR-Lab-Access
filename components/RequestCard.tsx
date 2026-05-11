import { LabRequest } from "@/types";
import { format } from "date-fns";
import { Clock, Users, Printer, Wrench } from "lucide-react";

function fmt12(t: string) { const [h,m]=t.split(":").map(Number); return `${h%12||12}:${String(m).padStart(2,"0")} ${h>=12?"PM":"AM"}`; }
function fmtDate(d: string) { const [y,mo,day]=d.split("-").map(Number); return format(new Date(y,mo-1,day),"EEE, MMM d"); }

const STATUS: Record<LabRequest["status"], string> = {
  pending:   "bg-amber-950/30 text-amber-400 border-amber-800/40",
  approved:  "bg-emerald-950/30 text-emerald-400 border-emerald-800/40",
  completed: "bg-[#1a1a1a] text-[#555] border-[#222]",
  cancelled: "bg-red-950/30 text-red-500 border-red-900/40",
};

export default function RequestCard({ request, compact }: { request: LabRequest; compact?: boolean }) {
  return (
    <div className="card card-hover p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="font-semibold text-[16px] text-[#ebebeb]">{request.name}</p>
          {request.email && <p className="text-[13px] text-[#555] mt-0.5">{request.email}</p>}
        </div>
        <span className={`text-[12px] font-medium px-2.5 py-1 rounded-full border capitalize shrink-0 ${STATUS[request.status]}`}>{request.status}</span>
      </div>
      <div className="flex flex-wrap gap-4 text-[14px] text-[#777] mb-3">
        <span className="flex items-center gap-1.5"><Clock size={13}/>{fmtDate(request.date)} · {fmt12(request.startTime)} – {fmt12(request.endTime)}</span>
        {request.peopleCount && <span className="flex items-center gap-1.5"><Users size={13}/>{request.peopleCount} {request.peopleCount===1?"person":"people"}</span>}
        {request.uses3DPrinter && <span className="flex items-center gap-1.5"><Printer size={13}/>3D Printer</span>}
      </div>
      {request.projectPurpose && <p className="text-[14px] text-[#777]"><span className="text-[#555]">Purpose: </span>{request.projectPurpose}</p>}
      {!compact && request.tools && <p className="text-[13px] text-[#666] mt-1"><span className="text-[#444]">Tools: </span>{request.tools}</p>}
      {!compact && request.notes && <p className="text-[13px] text-[#555] mt-2 italic">{request.notes}</p>}
      <p className="text-[12px] text-[#333] mt-3">Submitted {format(new Date(request.createdAt),"MMM d, h:mm a")}</p>
    </div>
  );
}
