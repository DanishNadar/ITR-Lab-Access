import Nav from "@/components/Nav";
import WeekCalendar from "@/components/WeekCalendar";
import { getUpcomingRequests, getPastRequests } from "@/lib/queries";
import { format } from "date-fns";
import Link from "next/link";
import { ArrowLeft, Clock, User, CalendarDays, History } from "lucide-react";
import { LabRequest } from "@/types";

export const revalidate = 0;

function fmt12(t: string) { const [h,m]=t.split(":").map(Number); return `${h%12||12}:${String(m).padStart(2,"0")} ${h>=12?"PM":"AM"}`; }
function fmtDate(d: string) { const [y,mo,day]=d.split("-").map(Number); return format(new Date(y,mo-1,day),"MMM d, yyyy"); }

const STATUS_STYLES: Record<LabRequest["status"], string> = {
  pending:   "text-amber-400 bg-amber-950/30 border-amber-800/40",
  approved:  "text-emerald-400 bg-emerald-950/30 border-emerald-800/40",
  completed: "text-[#555] bg-[#141414] border-[#222]",
  cancelled: "text-red-500 bg-red-950/30 border-red-900/40",
};

export default async function SchedulePage() {
  const [upcoming, past] = await Promise.all([getUpcomingRequests(), getPastRequests()]);

  return (
    <>
      <Nav />
      <main className="max-w-6xl mx-auto px-5 py-12">
        {/* Header */}
        <div className="mb-8 anim-slide">
          <Link href="/" className="inline-flex items-center gap-1.5 text-[13px] text-[#555] hover:text-[#aaa] transition-colors mb-5">
            <ArrowLeft size={13}/> Back to home
          </Link>
          <h1 className="text-4xl font-bold text-white mb-2" style={{fontFamily:"var(--font-display)",letterSpacing:".05em"}}>
            SCHEDULE & AVAILABILITY
          </h1>
          <p className="text-[16px] text-[#666]">Visual calendar of upcoming lab openings and availability.</p>
        </div>

        {/* Visual week calendar */}
        <div className="mb-10 anim-slide delay-1">
          <WeekCalendar requests={upcoming} />
        </div>

        {/* ── Upcoming log ── */}
        <div className="mb-10 anim-slide delay-2">
          <div className="flex items-center gap-2 mb-5">
            <CalendarDays size={16} className="text-[#555]"/>
            <h2 className="text-[11px] uppercase tracking-widest text-[#555]">Upcoming Requests</h2>
            <span className="text-[12px] text-[#333] bg-[#1c1c1c] border border-[#252525] px-2 py-0.5 rounded-full ml-1">{upcoming.length}</span>
          </div>

          {upcoming.length > 0 ? (
            <div className="card overflow-hidden">
              <table className="w-full text-[15px]">
                <thead>
                  <tr className="border-b border-[#1e1e1e]">
                    {["Name","Date","Time","Purpose","Status"].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-[11px] uppercase tracking-widest text-[#444] font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {upcoming.map((r, i) => (
                    <tr key={r.id} className={`border-b border-[#151515] hover:bg-[#161616] transition-colors ${i === upcoming.length-1 ? "border-b-0" : ""}`}>
                      <td className="px-5 py-4">
                        <p className="font-medium text-[#e8e8e8]">{r.name}</p>
                        {r.email && <p className="text-[13px] text-[#555]">{r.email}</p>}
                      </td>
                      <td className="px-5 py-4 text-[#888]">{fmtDate(r.date)}</td>
                      <td className="px-5 py-4 text-[#888] font-mono text-[14px]">{fmt12(r.startTime)} – {fmt12(r.endTime)}</td>
                      <td className="px-5 py-4 text-[#666] max-w-[200px]">
                        <p className="truncate">{r.projectPurpose || <span className="text-[#333]">-</span>}</p>
                        {r.tools && <p className="text-[13px] text-[#444] truncate">{r.tools}</p>}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-[12px] font-medium px-2.5 py-1 rounded-full border capitalize ${STATUS_STYLES[r.status]}`}>{r.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="card p-10 text-center">
              <CalendarDays size={32} className="text-[#333] mx-auto mb-3" />
              <p className="text-[#555] text-[16px] mb-2">No upcoming requests scheduled</p>
              <Link href="/request" className="text-[14px] text-[#c80d0d] hover:text-[#ff5555] transition-colors">Submit the first request →</Link>
            </div>
          )}
        </div>

        {/* ── Past requests log ── */}
        {past.length > 0 && (
          <div className="anim-slide delay-3">
            <div className="flex items-center gap-2 mb-5">
              <History size={15} className="text-[#444]"/>
              <h2 className="text-[11px] uppercase tracking-widest text-[#444]">Past Requests</h2>
              <span className="text-[12px] text-[#333] bg-[#1c1c1c] border border-[#252525] px-2 py-0.5 rounded-full ml-1">{past.length}</span>
            </div>
            <div className="card overflow-hidden opacity-60 hover:opacity-80 transition-opacity">
              <table className="w-full text-[15px]">
                <thead>
                  <tr className="border-b border-[#1e1e1e]">
                    {["Name","Date","Time","Purpose","Status"].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-[11px] uppercase tracking-widest text-[#333] font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {past.slice(0, 20).map((r, i) => (
                    <tr key={r.id} className={`border-b border-[#131313] ${i === Math.min(past.length,20)-1 ? "border-b-0" : ""}`}>
                      <td className="px-5 py-3 font-medium text-[#666]">{r.name}</td>
                      <td className="px-5 py-3 text-[#555]">{fmtDate(r.date)}</td>
                      <td className="px-5 py-3 text-[#555] font-mono text-[14px]">{fmt12(r.startTime)} – {fmt12(r.endTime)}</td>
                      <td className="px-5 py-3 text-[#444] max-w-[200px]"><span className="truncate block">{r.projectPurpose || "-"}</span></td>
                      <td className="px-5 py-3">
                        <span className={`text-[12px] font-medium px-2.5 py-1 rounded-full border capitalize ${STATUS_STYLES[r.status]}`}>{r.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
