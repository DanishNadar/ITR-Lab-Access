"use client";

import { useState, useMemo } from "react";
import { LabRequest, ScheduleBlock } from "@/types";
import { getPersonColor } from "@/lib/calendarColors";
import { format, addDays, startOfWeek, isSameDay, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CalBlock {
  id: string;
  type: "request" | "availability" | "limbo-risk";
  start: Date;
  end: Date;
  label: string;
  sub?: string;
  color: string;
  bg: string;
  border: string;
}

interface Props {
  requests: LabRequest[];
  availabilityBlocks?: ScheduleBlock[];
}

const HOUR_START = 7;   // 7 AM
const HOUR_END   = 23;  // 11 PM
const HOURS = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i);
const PX_PER_MIN = 1.2; // pixels per minute - controls row height

function fmt12h(d: Date) {
  const h = d.getHours(), m = d.getMinutes();
  return `${h%12||12}:${String(m).padStart(2,"0")} ${h>=12?"PM":"AM"}`;
}

function blockStyle(block: CalBlock, dayStart: Date): React.CSSProperties {
  const dayStartMin = HOUR_START * 60;
  const blockStartMin = block.start.getHours() * 60 + block.start.getMinutes();
  const blockEndMin   = block.end.getHours() * 60 + block.end.getMinutes();
  const clampedStart  = Math.max(blockStartMin, dayStartMin);
  const clampedEnd    = Math.min(blockEndMin, HOUR_END * 60);
  const top    = (clampedStart - dayStartMin) * PX_PER_MIN;
  const height = Math.max((clampedEnd - clampedStart) * PX_PER_MIN, 24);
  return { position: "absolute", top, left: "3px", right: "3px", height, zIndex: 10, overflow: "hidden" };
}

export default function WeekCalendar({ requests, availabilityBlocks = [] }: Props) {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 0 }));

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const today = new Date();

  // Build calendar blocks from requests + availability
  const { blocks, personColorMap } = useMemo(() => {
    const allPersonNames = [...new Set(availabilityBlocks.map(a => a.peopleInvolved?.[0] ?? a.label))].sort();

    const reqBlocks: CalBlock[] = requests.map((r) => {
      const start = parseISO(`${r.date}T${r.startTime}:00`);
      const end   = parseISO(`${r.date}T${r.endTime}:00`);
      return {
        id: r.id, type: "request" as const, start, end,
        label: r.name, sub: r.projectPurpose || undefined,
        color: "text-blue-300", bg: "bg-blue-950/60", border: "border-blue-700/50",
      };
    });

    const colorMap = new Map<string, ReturnType<typeof getPersonColor>>();
    const availBlocks: CalBlock[] = availabilityBlocks.map((a) => {
      const personName = a.peopleInvolved?.[0] ?? a.label;
      if (!colorMap.has(personName)) colorMap.set(personName, getPersonColor(personName, allPersonNames));
      const pc = colorMap.get(personName)!;
      return {
        id: a.id, type: "availability" as const,
        start: new Date(a.start), end: new Date(a.end),
        label: a.label,
        color: pc.color, bg: pc.bg, border: pc.border,
      };
    });

    return { blocks: [...reqBlocks, ...availBlocks], personColorMap: colorMap };
  }, [requests, availabilityBlocks]);

  // Blocks per day — handles multi-day blocks by clipping to day boundaries
  function blocksForDay(day: Date): CalBlock[] {
    const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, 0, 0);
    const dayEnd   = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59);
    return blocks
      .filter(b => b.start <= dayEnd && b.end > dayStart)
      .map(b => ({
        ...b,
        start: b.start < dayStart ? dayStart : b.start,
        end:   b.end   > dayEnd   ? dayEnd   : b.end,
      }));
  }

  const totalH = (HOUR_END - HOUR_START) * 60 * PX_PER_MIN;

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e1e1e]">
        <h2 className="text-[15px] font-semibold text-[#ccc]">
          {format(weekStart, "MMM d")} – {format(addDays(weekStart, 6), "MMM d, yyyy")}
        </h2>
        <div className="flex items-center gap-2">
          <button onClick={() => setWeekStart(d => addDays(d, -7))} className="btn-secondary px-3 py-2 text-[13px]">
            <ChevronLeft size={15} />
          </button>
          <button onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 0 }))}
            className="btn-secondary px-4 py-2 text-[13px]">Today</button>
          <button onClick={() => setWeekStart(d => addDays(d, 7))} className="btn-secondary px-3 py-2 text-[13px]">
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      {/* Day-of-week headers */}
      <div className="grid border-b border-[#1e1e1e]" style={{ gridTemplateColumns: "52px repeat(7,1fr)" }}>
        <div className="border-r border-[#1e1e1e]" />
        {days.map((day) => {
          const isToday = isSameDay(day, today);
          return (
            <div key={day.toString()} className={`px-2 py-3 text-center border-r border-[#1e1e1e] last:border-r-0 ${isToday ? "bg-[#1a0303]" : ""}`}>
              <p className="text-[11px] uppercase tracking-widest text-[#555] mb-0.5">{format(day,"EEE")}</p>
              <p className={`text-[18px] font-bold leading-none ${isToday ? "text-[#ff5555]" : "text-[#888]"}`}>{format(day,"d")}</p>
            </div>
          );
        })}
      </div>

      {/* Scrollable grid */}
      <div className="overflow-y-auto" style={{ maxHeight: "540px" }}>
        <div className="grid" style={{ gridTemplateColumns: "52px repeat(7,1fr)" }}>
          {/* Hour labels column */}
          <div className="border-r border-[#1e1e1e]">
            {HOURS.map((h) => (
              <div key={h} style={{ height: 60 * PX_PER_MIN }}
                className="flex items-start justify-end pr-3 pt-1 border-b border-[#1a1a1a]">
                <span className="text-[11px] text-[#3a3a3a] font-mono leading-none">
                  {h === 12 ? "12p" : h > 12 ? `${h-12}p` : `${h}a`}
                </span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((day) => {
            const isToday = isSameDay(day, today);
            const dayBlocks = blocksForDay(day);
            return (
              <div key={day.toString()} className={`border-r border-[#1e1e1e] last:border-r-0 relative ${isToday ? "bg-[#1a0303]/20" : ""}`}
                style={{ height: totalH }}>
                {/* Hour gridlines */}
                {HOURS.map((h) => (
                  <div key={h} style={{ position:"absolute", top:(h-HOUR_START)*60*PX_PER_MIN, left:0, right:0, height:1 }}
                    className="bg-[#1a1a1a]" />
                ))}

                {/* Current time indicator */}
                {isToday && (() => {
                  const now = new Date();
                  const nowMin = now.getHours()*60 + now.getMinutes();
                  const top = (nowMin - HOUR_START*60) * PX_PER_MIN;
                  if (top < 0 || top > totalH) return null;
                  return (
                    <div style={{ position:"absolute", top, left:0, right:0, zIndex:20 }} className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-[#c80d0d] ml-0.5 shrink-0" />
                      <div className="flex-1 h-px bg-[#c80d0d]" />
                    </div>
                  );
                })()}

                {/* Event blocks */}
                {dayBlocks.map((block) => (
                  <div key={block.id} style={blockStyle(block, day)}
                    className={`rounded-lg border px-2 py-1 ${block.bg} ${block.border} cursor-default select-none group`}>
                    <p className={`text-[12px] font-semibold leading-tight ${block.color} truncate`}>{block.label}</p>
                    <p className="text-[11px] text-[#666] leading-tight">
                      {fmt12h(block.start)} – {fmt12h(block.end)}
                    </p>
                    {block.sub && (
                      <p className="text-[11px] text-[#555] truncate leading-tight mt-0.5">{block.sub}</p>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-5 py-3 border-t border-[#1e1e1e]">
        <span className="flex items-center gap-2 text-[13px] text-[#666]">
          <span className="w-3 h-3 rounded bg-blue-950/60 border border-blue-700/50" />
          Lab Request
        </span>
        {[...personColorMap.entries()].map(([name, pc]) => (
          <span key={name} className="flex items-center gap-2 text-[13px] text-[#666]">
            <span className={`w-3 h-3 rounded ${pc.bg} ${pc.border} border`} />
            {name}
          </span>
        ))}
        <span className="flex items-center gap-2 text-[13px] text-[#666]">
          <span className="w-3 h-2 bg-[#c80d0d] rounded-sm" />
          Current time
        </span>
      </div>
    </div>
  );
}
