"use client";

import { useState, useRef, useEffect } from "react";
import { Clock, ChevronDown } from "lucide-react";

interface Props {
  value?: string;
  onChange: (v: string) => void;
  placeholder?: string;
  minTime?: string;
  className?: string;
  error?: boolean;
}

function fmt(t: string) {
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2,"0")} ${h >= 12 ? "PM" : "AM"}`;
}

const ALL_SLOTS = Array.from({ length: 96 }, (_, i) => {
  const h = Math.floor(i/4), m = (i%4)*15;
  return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`;
});

const PERIOD_HEADS: Record<string, string> = {
  "00": "Midnight",  "05": "Early Morning",
  "08": "Morning",   "12": "Afternoon",
  "17": "Evening",   "21": "Night",
};

const QUICK = ["08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00","20:00"];

export default function TimePickerInput({ value, onChange, placeholder = "Select time", minTime, className = "", error }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref   = useRef<HTMLDivElement>(null);
  const list  = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setSearch(""); }};
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  useEffect(() => {
    if (open && list.current) {
      const target = value || (() => {
        const n = new Date(), h = n.getHours(), m = Math.ceil(n.getMinutes()/15)*15;
        const rh = m >= 60 ? h+1 : h, rm = m >= 60 ? 0 : m;
        return `${String(rh).padStart(2,"0")}:${String(rm).padStart(2,"0")}`;
      })();
      list.current.querySelector(`[data-t="${target}"]`)?.scrollIntoView({ block:"center", behavior:"instant" });
    }
  }, [open]);

  const disabled = (s: string) => !!minTime && s <= minTime;

  const filtered = ALL_SLOTS.filter(s => {
    if (!search) return true;
    return s.includes(search) || fmt(s).toLowerCase().includes(search.toLowerCase());
  });

  let lastHead = "";
  return (
    <div className={`relative ${className}`} ref={ref}>
      <button type="button" onClick={() => setOpen(o => !o)}
        className={`input flex items-center justify-between gap-2 cursor-pointer text-left ${!value ? "text-[#454545]" : ""} ${error ? "border-red-600" : ""}`}>
        <span className="flex items-center gap-2.5">
          <Clock size={16} className="text-[#555] shrink-0" />
          {value ? fmt(value) : placeholder}
        </span>
        <ChevronDown size={15} className={`text-[#555] shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-50 mt-2 left-0 w-60 rounded-2xl border border-[#252525] bg-[#141414] shadow-2xl overflow-hidden anim-fade">
          {/* Search */}
          <div className="p-2.5 border-b border-[#1e1e1e]">
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Type a time…"
              className="w-full bg-[#0f0f0f] border border-[#252525] rounded-lg px-3 py-2 text-[14px] text-[#ebebeb] placeholder-[#3a3a3a] outline-none focus:border-[#c80d0d]"
              autoFocus />
          </div>

          {/* Quick picks */}
          {!search && (
            <div className="p-2.5 border-b border-[#1e1e1e]">
              <p className="text-[10px] text-[#444] uppercase tracking-widest mb-2 px-0.5">Quick pick</p>
              <div className="flex flex-wrap gap-1.5">
                {QUICK.map(t => {
                  const dis = disabled(t);
                  return (
                    <button key={t} type="button" disabled={dis} onClick={() => { onChange(t); setOpen(false); }}
                      className={`text-[12px] px-2 py-1 rounded-lg border transition-all ${
                        value === t ? "border-[#c80d0d] bg-[#c80d0d15] text-[#ff5555]"
                        : dis ? "border-[#1e1e1e] text-[#2a2a2a] cursor-not-allowed"
                        : "border-[#252525] text-[#777] hover:border-[#333] hover:text-[#ccc]"
                      }`}>{fmt(t)}</button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Full list */}
          <div ref={list} className="max-h-56 overflow-y-auto">
            {filtered.map(slot => {
              const hour = slot.slice(0,2);
              const head = PERIOD_HEADS[hour];
              const showHead = !search && !!head && hour !== lastHead;
              if (showHead) lastHead = hour;
              const dis = disabled(slot);
              return (
                <div key={slot}>
                  {showHead && (
                    <div className="px-3 py-1 text-[10px] text-[#3a3a3a] uppercase tracking-widest bg-[#0f0f0f] sticky top-0">{head}</div>
                  )}
                  <button type="button" data-t={slot} disabled={dis} onClick={() => { if (!dis) { onChange(slot); setOpen(false); setSearch(""); }}}
                    className={`w-full text-left px-4 py-2 text-[14px] transition-colors ${
                      value === slot ? "bg-[#c80d0d18] text-[#ff5555] font-semibold"
                      : dis ? "text-[#2a2a2a] cursor-not-allowed"
                      : "text-[#aaa] hover:bg-[#1c1c1c] hover:text-[#ebebeb] cursor-pointer"
                    }`}>
                    {fmt(slot)}
                    {value === slot && <span className="float-right text-[#c80d0d] text-[12px]">✓</span>}
                  </button>
                </div>
              );
            })}
            {!filtered.length && <p className="text-center text-[14px] text-[#444] py-8">No match</p>}
          </div>
        </div>
      )}
    </div>
  );
}
