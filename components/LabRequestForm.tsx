"use client";

import { useState } from "react";
import DatePickerInput from "@/components/DatePickerInput";
import TimePickerInput from "@/components/TimePickerInput";
import { CheckCircle2, AlertCircle, Loader2, Send } from "lucide-react";

interface F {
  name: string; email: string; date: string; startTime: string; endTime: string;
  projectPurpose: string; tools: string; peopleCount: string;
  uses3DPrinter: boolean; safetyTraining: boolean; specialEquipment: string; notes: string;
}
const BLANK: F = { name:"",email:"",date:"",startTime:"",endTime:"",projectPurpose:"",tools:"",
  peopleCount:"1",uses3DPrinter:false,safetyTraining:true,specialEquipment:"",notes:"" };

export default function LabRequestForm() {
  const [form, setForm] = useState<F>(BLANK);
  const [errors, setErrors] = useState<Partial<Record<keyof F, string>>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [apiError, setApiError] = useState<string|null>(null);

  function set<K extends keyof F>(k: K, v: F[K]) {
    setForm(f => ({...f,[k]:v}));
    setErrors(e => ({...e,[k]:undefined}));
  }

  function validate() {
    const e: typeof errors = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.date) e.date = "Please select a date";
    if (!form.startTime) e.startTime = "Opening time is required";
    if (!form.endTime) e.endTime = "Leave time is required";
    if (form.startTime && form.endTime && form.endTime <= form.startTime) e.endTime = "Must be after opening time";
    setErrors(e);
    return !Object.keys(e).length;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true); setApiError(null);
    try {
      const res = await fetch("/api/request", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(form) });
      const d = await res.json();
      if (!d.success) throw new Error(d.error || "Submission failed");
      setSuccess(true); setForm(BLANK);
    } catch(err:any) { setApiError(err.message); }
    setLoading(false);
  }

  if (success) return (
    <div className="card p-12 text-center anim-slide">
      <div className="w-16 h-16 rounded-full bg-emerald-950/50 border border-emerald-700/40 flex items-center justify-center mx-auto mb-5">
        <CheckCircle2 size={32} className="text-emerald-400" />
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">Request Submitted!</h2>
      <p className="text-[#888] text-[16px] mb-8 max-w-sm mx-auto">
        Your request has been logged and a notification has been sent to Danish.
      </p>
      <button onClick={() => setSuccess(false)} className="btn-secondary">Submit another request</button>
    </div>
  );

  return (
    <form onSubmit={submit} className="space-y-5">
      {/* Who */}
      <section className="card p-6">
        <h2 className="text-[11px] uppercase tracking-widest text-[#555] mb-5">Who is requesting access?</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Name" required error={errors.name}>
            <input className={`input ${errors.name?"border-red-600":""}`} placeholder="Your full name" value={form.name} onChange={e=>set("name",e.target.value)} />
          </Field>
          <Field label="Email">
            <input className="input" type="email" placeholder="yourname@hawk.illinoistech.edu" value={form.email} onChange={e=>set("email",e.target.value)} />
          </Field>
        </div>
      </section>

      {/* When */}
      <section className="card p-6">
        <h2 className="text-[11px] uppercase tracking-widest text-[#555] mb-5">When do you need the lab open?</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <Field label="Date" required error={errors.date}>
            <DatePickerInput value={form.date} onChange={v=>set("date",v)} minDate={new Date()} error={!!errors.date} />
          </Field>
          <Field label="Opening time" required error={errors.startTime}>
            <TimePickerInput value={form.startTime} onChange={v=>set("startTime",v)} placeholder="Start time" error={!!errors.startTime} />
          </Field>
          <Field label="Expected leave time" required error={errors.endTime}>
            <TimePickerInput value={form.endTime} onChange={v=>set("endTime",v)} minTime={form.startTime} placeholder="End time" error={!!errors.endTime} />
          </Field>
        </div>
      </section>

      {/* What */}
      <section className="card p-6">
        <h2 className="text-[11px] uppercase tracking-widest text-[#555] mb-5">What will you be working on?</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Project / purpose">
            <input className="input" placeholder="FTC drivetrain, quadruped, CAD work…" value={form.projectPurpose} onChange={e=>set("projectPurpose",e.target.value)} />
          </Field>
          <Field label="How many people coming?">
            <input className="input" type="number" min={1} max={40} value={form.peopleCount} onChange={e=>set("peopleCount",e.target.value)} />
          </Field>
          <Field label="Materials / tools you'll use">
            <input className="input" placeholder="PLA, soldering iron, hand tools, laptops…" value={form.tools} onChange={e=>set("tools",e.target.value)} />
          </Field>
          <Field label="Special equipment needed?">
            <input className="input" placeholder="Oscilloscope, power supply, etc." value={form.specialEquipment} onChange={e=>set("specialEquipment",e.target.value)} />
          </Field>
          <Toggle label="Will you use the 3D printer?" value={form.uses3DPrinter} onChange={v=>set("uses3DPrinter",v)} falseLabel="No" trueLabel="Yes" />
          <Toggle label="Completed safety training?" value={form.safetyTraining} onChange={v=>set("safetyTraining",v)} falseLabel="Not yet" trueLabel="Yes, completed" />
        </div>
      </section>

      {/* Notes */}
      <section className="card p-6">
        <h2 className="text-[11px] uppercase tracking-widest text-[#555] mb-5">Anything else?</h2>
        <textarea className="input resize-none h-28 text-[15px]" placeholder="Any extra context…" value={form.notes} onChange={e=>set("notes",e.target.value)} />
      </section>

      {apiError && (
        <div className="flex items-center gap-3 px-5 py-4 rounded-xl bg-red-950/40 border border-red-800/40 text-red-400 text-[15px]">
          <AlertCircle size={18} /> {apiError}
        </div>
      )}

      <div className="flex items-center justify-between gap-4 pb-2">
        <button type="submit" disabled={loading} className="btn-primary text-[16px] px-7 py-3">
          {loading ? <><Loader2 size={16} className="animate-spin" /> Sending…</> : <><Send size={16}/> Send request</>}
        </button>
        <p className="text-[13px] text-[#444] hidden sm:block">Sends details to dnadar@hawk.illinoistech.edu</p>
      </div>
    </form>
  );
}

function Field({ label, required, error, children }: { label:string; required?:boolean; error?:string; children:React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[14px] text-[#888]">{label}{required && <span className="text-[#c80d0d] ml-0.5">*</span>}</label>
      {children}
      {error && <p className="text-[13px] text-red-400">{error}</p>}
    </div>
  );
}

function Toggle({ label, value, onChange, falseLabel, trueLabel }: { label:string; value:boolean; onChange:(v:boolean)=>void; falseLabel:string; trueLabel:string }) {
  return (
    <div>
      <p className="text-[14px] text-[#888] mb-2">{label}</p>
      <div className="flex gap-2">
        {[false, true].map(opt => (
          <button key={String(opt)} type="button" onClick={() => onChange(opt)}
            className={`flex-1 py-2.5 rounded-xl text-[14px] font-medium border transition-all ${
              value === opt ? "border-[#c80d0d] bg-[#c80d0d15] text-[#ff5555]" : "border-[#252525] text-[#666] hover:border-[#333] hover:text-[#bbb]"
            }`}>{opt ? trueLabel : falseLabel}</button>
        ))}
      </div>
    </div>
  );
}
