import Link from "next/link";
import { getLabStatus, getUpcomingRequests } from "@/lib/queries";
import LabStatusCard from "@/components/LabStatusCard";
import RequestCard from "@/components/RequestCard";
import Nav from "@/components/Nav";
import Image from "next/image";
import { CalendarDays, ClipboardList, Settings } from "lucide-react";

export const revalidate = 0;

export default async function HomePage() {
  const [status, upcoming] = await Promise.all([getLabStatus(), getUpcomingRequests()]);
  const next = upcoming[0] ?? null;

  return (
    <>
      <Nav />
      <main className="max-w-5xl mx-auto px-5 py-12">
        {/* Hero */}
        <div className="mb-10 anim-slide">
          <div className="flex items-center gap-2.5 mb-4">
            <Image src="/ITR_Logo.png" alt="ITR Logo" width={36} height={36} className="rounded-xl" />
            <span className="text-[13px] uppercase tracking-widest text-[#555] font-medium">Illinois Tech Robotics</span>
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold text-white leading-none mb-3"
            style={{ fontFamily:"var(--font-display)", letterSpacing:".05em" }}>
            ELEVATE UNDERGROUND<br />
            <span className="text-[#c80d0d]">LAB ACCESS</span>
          </h1>
          <p className="text-[17px] text-[#666] max-w-lg leading-relaxed">
            Request that the lab be opened, check current status, and view the availability schedule.
          </p>
        </div>

        {/* Status */}
        <div className="mb-5 anim-slide delay-1">
          <LabStatusCard status={status} nextRequest={next} />
        </div>

        {/* Quick actions */}
        <div className="grid sm:grid-cols-3 gap-4 mb-12 anim-slide delay-2">
          <Link href="/request" className="card card-hover p-5 flex items-center gap-4 group">
            <div className="w-11 h-11 rounded-xl bg-[#c80d0d] flex items-center justify-center shrink-0 group-hover:bg-[#a50f0f] transition-colors">
              <ClipboardList size={19} className="text-white" />
            </div>
            <div>
              <p className="text-[16px] font-semibold text-white">Request Access</p>
              <p className="text-[13px] text-[#666]">Submit a lab opening request</p>
            </div>
          </Link>
          <Link href="/schedule" className="card card-hover p-5 flex items-center gap-4 group">
            <div className="w-11 h-11 rounded-xl bg-[#1c1c1c] border border-[#2a2a2a] flex items-center justify-center shrink-0 group-hover:border-[#444] transition-colors">
              <CalendarDays size={19} className="text-[#888]" />
            </div>
            <div>
              <p className="text-[16px] font-semibold text-white">View Schedule</p>
              <p className="text-[13px] text-[#666]">See upcoming openings</p>
            </div>
          </Link>
          <Link href="/admin" className="card card-hover p-5 flex items-center gap-4 group">
            <div className="w-11 h-11 rounded-xl bg-[#1c1c1c] border border-[#2a2a2a] flex items-center justify-center shrink-0 group-hover:border-[#444] transition-colors">
              <Settings size={19} className="text-[#888]" />
            </div>
            <div>
              <p className="text-[16px] font-semibold text-white">Admin</p>
              <p className="text-[13px] text-[#666]">Manage lab status</p>
            </div>
          </Link>
        </div>

        {/* Upcoming */}
        <div className="anim-slide delay-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[11px] uppercase tracking-widest text-[#444]">Upcoming Requests</h2>
            <Link href="/schedule" className="text-[14px] text-[#555] hover:text-[#bbb] transition-colors">View all →</Link>
          </div>
          {upcoming.length > 0 ? (
            <div className="space-y-3">
              {upcoming.slice(0,3).map(r => <RequestCard key={r.id} request={r} compact />)}
            </div>
          ) : (
            <div className="card p-10 text-center">
              <p className="text-[#555] text-[16px] mb-2">No upcoming requests yet.</p>
              <Link href="/request" className="text-[14px] text-[#c80d0d] hover:text-[#ff5555] transition-colors">
                Be the first to request access →
              </Link>
            </div>
          )}
        </div>

        {/* Discord note */}
        <div className="mt-10 p-4 rounded-xl border border-dashed border-[#222] text-center anim-slide delay-4">
          <p className="text-[13px] text-[#3a3a3a]">
            Discord bot integration ready ·{" "}
            <span className="font-mono text-[#444]">POST /api/lab/open · /api/lab/closed · /api/lab/limbo</span>
          </p>
        </div>
      </main>
    </>
  );
}
