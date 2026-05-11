"use client";

import { useState, useRef, useEffect } from "react";
import { DayPicker } from "react-day-picker";
import { format } from "date-fns";
import { CalendarDays, ChevronDown } from "lucide-react";
import "react-day-picker/dist/style.css";

interface Props {
  value?: string;
  onChange: (v: string) => void;
  placeholder?: string;
  minDate?: Date;
  className?: string;
  error?: boolean;
}

export default function DatePickerInput({ value, onChange, placeholder = "Pick a date", minDate, className = "", error }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = value ? (() => { const [y,m,d]=value.split("-").map(Number); return new Date(y,m-1,d); })() : undefined;
  const display  = selected ? format(selected, "EEE, MMM d, yyyy") : undefined;

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button type="button" onClick={() => setOpen(o => !o)}
        className={`input flex items-center justify-between gap-2 cursor-pointer text-left ${!display ? "text-[#454545]" : "text-[#ebebeb]"} ${error ? "border-red-600" : ""}`}>
        <span className="flex items-center gap-2.5">
          <CalendarDays size={16} className="text-[#555] shrink-0" />
          {display || placeholder}
        </span>
        <ChevronDown size={15} className={`text-[#555] shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute z-50 mt-2 left-0 rounded-2xl border border-[#252525] bg-[#141414] shadow-2xl overflow-hidden anim-fade">
          <DayPicker
            mode="single" selected={selected}
            onSelect={(day) => {
              if (!day) return;
              const y = day.getFullYear(), m = String(day.getMonth()+1).padStart(2,"0"), d = String(day.getDate()).padStart(2,"0");
              onChange(`${y}-${m}-${d}`); setOpen(false);
            }}
            disabled={minDate ? { before: minDate } : undefined}
            fromDate={minDate || new Date()}
            showOutsideDays={false}
            className="p-3"
          />
        </div>
      )}
    </div>
  );
}
