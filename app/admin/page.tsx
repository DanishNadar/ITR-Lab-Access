"use client";

import { useState } from "react";
import Nav from "@/components/Nav";
import { LabRequest, LabStatus } from "@/types";
import { LAB_STATE_CONFIG } from "@/lib/labStatus";
import { Lock, Unlock, RefreshCw, Upload, Loader2, AlertCircle, CheckCircle2, ArrowLeft, CalendarDays, Trash2 } from "lucide-react";
import { CALENDAR_PALETTE, getPersonColor } from "@/lib/calendarColors";
import Link from "next/link";
import { format } from "date-fns";

type Tab = "status" | "requests" | "calendars";
type Filter = "upcoming" | "past" | "all";

function fmt12(t: string) { const [h,m]=t.split(":").map(Number); return `${h%12||12}:${String(m).padStart(2,"0")} ${h>=12?"PM":"AM"}`; }
function fmtDate(d: string) { const [y,mo,day]=d.split("-").map(Number); return format(new Date(y,mo-1,day),"MMM d, yyyy"); }

const STATUS_STYLES: Record<LabRequest["status"], string> = {
  pending:  "text-amber-400 bg-amber-950/30 border-amber-800/40",
  approved: "text-emerald-400 bg-emerald-950/30 border-emerald-800/40",
  completed:"text-[#555] bg-[#141414] border-[#222]",
  cancelled:"text-red-500 bg-red-950/30 border-red-900/40",
};

export default function AdminPage() {
  const [pw, setPw] = useState(""); const [authed, setAuthed] = useState(false);
  const [authErr, setAuthErr] = useState(""); const [authLoading, setAuthLoading] = useState(false);
  const [tab, setTab] = useState<Tab>("status");
  const [requests, setRequests] = useState<LabRequest[]>([]);
  const [filter, setFilter] = useState<Filter>("upcoming");
  const [labStatus, setLabStatus] = useState<LabStatus | null>(null);
  const [newState, setNewState] = useState<"open"|"closed"|"limbo">("closed");
  const [person, setPerson] = useState(""); const [notes, setNotes] = useState("");
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ok:boolean;text:string}|null>(null);
  const [calPerson, setCalPerson] = useState(""); const [calFile, setCalFile] = useState<File|null>(null);
  const [calLoading, setCalLoading] = useState(false); const [calMsg, setCalMsg] = useState<{ok:boolean;text:string}|null>(null);
  const [calendars, setCalendars] = useState<any[]>([]);
  const [deletingId, setDeletingId] = useState<string|null>(null);

  async function auth(e: React.FormEvent) {
    e.preventDefault(); setAuthLoading(true); setAuthErr("");
    const res = await fetch("/api/admin", { method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ password:pw, action:"getRequests", filter:"upcoming" }) });
    const d = await res.json();
    if (d.success) { setAuthed(true); setRequests(d.data); fetchStatus(); }
    else setAuthErr("Incorrect password");
    setAuthLoading(false);
  }

  async function fetchStatus() {
    const res = await fetch("/api/lab/status"); const d = await res.json();
    if (d.success) setLabStatus(d.data.status);
  }

  async function fetchRequests(f: Filter) {
    setFilter(f);
    const res = await fetch("/api/admin", { method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ password:pw, action:"getRequests", filter:f }) });
    const d = await res.json(); if (d.success) setRequests(d.data);
  }

  async function updateStatus() {
    setStatusLoading(true); setStatusMsg(null);
    const res = await fetch("/api/admin", { method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ password:pw, action:"updateStatus", state:newState,
        responsiblePerson: person||undefined, notes: notes||undefined }) });
    const d = await res.json();
    if (d.success) { setLabStatus(d.data); setStatusMsg({ok:true,text:`Lab marked as ${newState}`}); }
    else setStatusMsg({ok:false,text:d.error});
    setStatusLoading(false);
  }

  async function fetchCalendars() {
    const res = await fetch("/api/calendars", { headers: { "x-admin-password": pw } });
    const d = await res.json();
    if (d.success) setCalendars(d.data);
  }

  async function uploadCal() {
    if (!calFile || !calPerson) return;
    setCalLoading(true); setCalMsg(null);
    const fd = new FormData();
    fd.append("password",pw); fd.append("personName",calPerson); fd.append("file",calFile);
    const res = await fetch("/api/calendars",{method:"POST",body:fd}); const d = await res.json();
    if (d.success) {
      setCalMsg({ok:true,text:`Uploaded ${d.data.eventCount} events for ${d.data.personName}`});
      setCalPerson(""); setCalFile(null);
      fetchCalendars();
    } else setCalMsg({ok:false,text:d.error});
    setCalLoading(false);
  }

  async function deleteCal(id: string) {
    setDeletingId(id);
    const res = await fetch("/api/calendars", { method:"DELETE", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ id, password: pw }) });
    const d = await res.json();
    if (d.success) setCalendars(prev => prev.filter(c => c.id !== id));
    setDeletingId(null);
  }

  if (!authed) return (
    <>
      <Nav />
      <main className="max-w-sm mx-auto px-5 py-24">
        <Link href="/" className="inline-flex items-center gap-1.5 text-[13px] text-[#555] hover:text-[#aaa] transition-colors mb-8">
          <ArrowLeft size={13}/> Back
        </Link>
        <div className="w-12 h-12 rounded-2xl bg-[#1c1c1c] border border-[#252525] flex items-center justify-center mb-5">
          <Lock size={20} className="text-[#666]" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-1" style={{fontFamily:"var(--font-display)",letterSpacing:".05em"}}>ADMIN ACCESS</h1>
        <p className="text-[15px] text-[#555] mb-8">Enter your admin password to continue.</p>
        <form onSubmit={auth} className="space-y-4">
          <input type="password" value={pw} onChange={e=>setPw(e.target.value)} placeholder="Admin password" className="input" autoFocus />
          {authErr && <p className="text-[14px] text-red-400 flex items-center gap-2"><AlertCircle size={14}/>{authErr}</p>}
          <button type="submit" disabled={authLoading||!pw} className="btn-primary w-full justify-center py-3 text-[16px]">
            {authLoading ? <><Loader2 size={16} className="animate-spin"/> Checking…</> : <><Unlock size={16}/> Sign In</>}
          </button>
        </form>
        <p className="text-[12px] text-[#333] mt-5 text-center">Set ADMIN_PASSWORD in .env.local</p>
      </main>
    </>
  );

  return (
    <>
      <Nav />
      <main className="max-w-5xl mx-auto px-5 py-12">
        <div className="mb-8 anim-slide">
          <Link href="/" className="inline-flex items-center gap-1.5 text-[13px] text-[#555] hover:text-[#aaa] transition-colors mb-5">
            <ArrowLeft size={13}/> Back
          </Link>
          <h1 className="text-4xl font-bold text-white mb-1" style={{fontFamily:"var(--font-display)",letterSpacing:".05em"}}>ADMIN DASHBOARD</h1>
          <p className="text-[15px] text-[#666]">Manage lab status, view requests, and upload availability calendars.</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 mb-8 bg-[#0f0f0f] p-1.5 rounded-2xl border border-[#1e1e1e] w-fit anim-slide delay-1">
          {(["status","requests","calendars"] as const).map(t => (
            <button key={t} onClick={() => { setTab(t); if(t==="requests") fetchRequests(filter); if(t==="calendars") fetchCalendars(); }}
              className={`px-5 py-2 rounded-xl text-[15px] font-medium transition-all capitalize ${
                tab===t ? "bg-[#1c1c1c] text-white border border-[#2a2a2a]" : "text-[#666] hover:text-[#aaa]"
              }`}>{t}</button>
          ))}
        </div>

        {/* ── Status tab ── */}
        {tab === "status" && (
          <div className="space-y-5 anim-slide">
            {labStatus && (
              <div className="card p-6">
                <p className="text-[11px] uppercase tracking-widest text-[#444] mb-4">Current Status</p>
                <div className="flex items-center gap-3 mb-2">
                  <span className={`status-dot ${labStatus.currentState}`} />
                  <span className={`text-2xl font-bold ${LAB_STATE_CONFIG[labStatus.currentState].color}`}
                    style={{fontFamily:"var(--font-display)",letterSpacing:".06em"}}>{labStatus.currentState.toUpperCase()}</span>
                  {labStatus.responsiblePerson && <span className="text-[14px] text-[#666]">· {labStatus.responsiblePerson}</span>}
                </div>
                {labStatus.notes && <p className="text-[15px] text-[#666]">{labStatus.notes}</p>}
              </div>
            )}
            <div className="card p-6">
              <p className="text-[11px] uppercase tracking-widest text-[#444] mb-5">Update Lab State</p>
              <div className="flex gap-3 mb-5">
                {(["open","closed","limbo"] as const).map(s => {
                  const c = LAB_STATE_CONFIG[s];
                  return (
                    <button key={s} onClick={()=>setNewState(s)}
                      className={`flex-1 py-3 rounded-xl text-[15px] font-semibold border transition-all capitalize ${
                        newState===s ? `${c.bgColor} ${c.color} ${c.borderColor}` : "border-[#252525] text-[#666] hover:border-[#333] hover:text-[#aaa]"
                      }`}>{c.emoji} {s}</button>
                  );
                })}
              </div>
              {newState==="open" && (
                <div className="mb-4">
                  <label className="text-[14px] text-[#666] block mb-2">Responsible person</label>
                  <input className="input" placeholder="Who is supervising?" value={person} onChange={e=>setPerson(e.target.value)} />
                </div>
              )}
              <div className="mb-5">
                <label className="text-[14px] text-[#666] block mb-2">Notes (optional)</label>
                <textarea className="input resize-none h-20 text-[15px]" placeholder="Additional context…" value={notes} onChange={e=>setNotes(e.target.value)} />
              </div>
              {statusMsg && (
                <div className={`flex items-center gap-2 text-[15px] mb-4 ${statusMsg.ok?"text-emerald-400":"text-red-400"}`}>
                  {statusMsg.ok ? <CheckCircle2 size={16}/> : <AlertCircle size={16}/>} {statusMsg.text}
                </div>
              )}
              <button onClick={updateStatus} disabled={statusLoading} className="btn-primary py-3 px-7 text-[15px]">
                {statusLoading ? <><Loader2 size={15} className="animate-spin"/> Updating…</> : <><RefreshCw size={15}/> Update Status</>}
              </button>
            </div>
          </div>
        )}

        {/* ── Requests tab ── */}
        {tab === "requests" && (
          <div className="anim-slide">
            <div className="flex gap-2 mb-5">
              {(["upcoming","past","all"] as Filter[]).map(f => (
                <button key={f} onClick={()=>fetchRequests(f)}
                  className={`px-4 py-2 rounded-xl text-[14px] font-medium border transition-all capitalize ${
                    filter===f ? "border-[#333] bg-[#1c1c1c] text-white" : "border-[#252525] text-[#666] hover:text-[#bbb]"
                  }`}>{f}</button>
              ))}
            </div>
            {requests.length > 0 ? (
              <div className="card overflow-hidden">
                <table className="w-full text-[15px]">
                  <thead>
                    <tr className="border-b border-[#1e1e1e]">
                      {["Name / Email","Date","Time","Purpose","People","Status"].map(h=>(
                        <th key={h} className="px-5 py-3.5 text-left text-[11px] uppercase tracking-widest text-[#444] font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((r,i)=>(
                      <tr key={r.id} className={`border-b border-[#151515] hover:bg-[#161616] transition-colors ${i===requests.length-1?"border-b-0":""}`}>
                        <td className="px-5 py-4">
                          <p className="font-medium text-[#e8e8e8]">{r.name}</p>
                          {r.email&&<p className="text-[13px] text-[#555]">{r.email}</p>}
                        </td>
                        <td className="px-5 py-4 text-[#888]">{fmtDate(r.date)}</td>
                        <td className="px-5 py-4 text-[#888] font-mono text-[14px]">{fmt12(r.startTime)} – {fmt12(r.endTime)}</td>
                        <td className="px-5 py-4 text-[#666] max-w-[180px]"><span className="truncate block">{r.projectPurpose||"-"}</span></td>
                        <td className="px-5 py-4 text-[#666]">{r.peopleCount||"-"}</td>
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
                <p className="text-[#555] text-[16px]">No {filter} requests</p>
              </div>
            )}
          </div>
        )}

        {/* ── Calendars tab ── */}
        {tab === "calendars" && (
          <div className="space-y-5 anim-slide">
            <div className="card p-6">
              <p className="text-[11px] uppercase tracking-widest text-[#444] mb-2">Upload Availability Calendar</p>
              <p className="text-[14px] text-[#666] mb-5 leading-relaxed">
                Upload a .ics file for an authorized member. Their busy times will be excluded from availability windows shown on the schedule.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="text-[14px] text-[#666] block mb-2">Person name</label>
                  <input className="input" placeholder="e.g. Danish Nadar" value={calPerson} onChange={e=>setCalPerson(e.target.value)} />
                </div>
                <div>
                  <label className="text-[14px] text-[#666] block mb-2">.ics calendar file</label>
                  <input type="file" accept=".ics" onChange={e=>setCalFile(e.target.files?.[0]||null)}
                    className="text-[14px] text-[#777] file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border file:border-[#252525] file:text-[13px] file:bg-[#1c1c1c] file:text-[#aaa] file:cursor-pointer hover:file:border-[#333] hover:file:text-white transition-all" />
                </div>
                {calMsg && (
                  <div className={`flex items-center gap-2 text-[15px] ${calMsg.ok?"text-emerald-400":"text-red-400"}`}>
                    {calMsg.ok?<CheckCircle2 size={16}/>:<AlertCircle size={16}/>} {calMsg.text}
                  </div>
                )}
                <button onClick={uploadCal} disabled={calLoading||!calFile||!calPerson} className="btn-secondary py-2.5 px-6 text-[15px]">
                  {calLoading?<><Loader2 size={15} className="animate-spin"/> Uploading…</>:<><Upload size={15}/> Upload Calendar</>}
                </button>
              </div>
            </div>

            {calendars.length > 0 && (() => {
              const allNames = [...calendars].sort((a,b) => a.personName.localeCompare(b.personName)).map(c => c.personName);
              return (
                <div className="card overflow-hidden">
                  <p className="text-[11px] uppercase tracking-widest text-[#444] px-5 pt-5 pb-4 border-b border-[#1a1a1a]">Uploaded Calendars</p>
                  <div className="divide-y divide-[#141414]">
                    {[...calendars].sort((a,b)=>a.personName.localeCompare(b.personName)).map(cal => {
                      const pc = getPersonColor(cal.personName, allNames);
                      const isDeleting = deletingId === cal.id;
                      return (
                        <div key={cal.id} className="flex items-center gap-4 px-5 py-4">
                          <span className={`w-3 h-3 rounded-full shrink-0 ${pc.dot}`} />
                          <div className="flex-1 min-w-0">
                            <p className={`text-[15px] font-medium ${pc.color}`}>{cal.personName}</p>
                            <p className="text-[12px] text-[#555] truncate">{cal.uploadedFileName} · {cal.events?.length ?? 0} events</p>
                          </div>
                          <button onClick={() => deleteCal(cal.id)} disabled={isDeleting}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] text-[#666] border border-[#252525] hover:border-red-800/60 hover:text-red-400 hover:bg-red-950/20 transition-all disabled:opacity-50">
                            {isDeleting ? <Loader2 size={13} className="animate-spin"/> : <Trash2 size={13}/>}
                            {isDeleting ? "Removing…" : "Remove"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            <div className="card p-6">
              <p className="text-[11px] uppercase tracking-widest text-[#444] mb-3">Discord Bot API Endpoints</p>
              <p className="text-[14px] text-[#555] mb-4">Authenticate with <code className="text-[#aaa] bg-[#1c1c1c] px-1.5 py-0.5 rounded">x-api-key: DISCORD_BOT_API_KEY</code></p>
              <div className="space-y-2">
                {[["POST","/api/lab/open","Mark lab as Open"],["POST","/api/lab/closed","Mark lab as Closed"],["POST","/api/lab/limbo","Mark lab as Limbo"],["GET","/api/lab/status","Get current status"],["GET","/api/lab/schedule","Get schedule blocks"]].map(([m,p,d])=>(
                  <div key={p} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#0f0f0f] border border-[#1e1e1e] font-mono">
                    <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${m==="GET"?"bg-blue-950/50 text-blue-400":"bg-emerald-950/50 text-emerald-400"}`}>{m}</span>
                    <span className="text-[14px] text-[#888]">{p}</span>
                    <span className="text-[13px] text-[#3a3a3a] ml-auto">{d}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
