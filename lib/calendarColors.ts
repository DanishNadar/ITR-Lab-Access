export interface PersonColor {
  color: string;   // text color
  bg: string;      // background
  border: string;  // border
  dot: string;     // solid dot for legend/admin
}

export const CALENDAR_PALETTE: PersonColor[] = [
  { color: "text-emerald-300", bg: "bg-emerald-950/40", border: "border-emerald-700/40", dot: "bg-emerald-400" },
  { color: "text-sky-300",     bg: "bg-sky-950/40",     border: "border-sky-700/40",     dot: "bg-sky-400" },
  { color: "text-violet-300",  bg: "bg-violet-950/40",  border: "border-violet-700/40",  dot: "bg-violet-400" },
  { color: "text-amber-300",   bg: "bg-amber-950/40",   border: "border-amber-700/40",   dot: "bg-amber-400" },
  { color: "text-rose-300",    bg: "bg-rose-950/40",    border: "border-rose-700/40",    dot: "bg-rose-400" },
  { color: "text-cyan-300",    bg: "bg-cyan-950/40",    border: "border-cyan-700/40",    dot: "bg-cyan-400" },
  { color: "text-orange-300",  bg: "bg-orange-950/40",  border: "border-orange-700/40",  dot: "bg-orange-400" },
  { color: "text-pink-300",    bg: "bg-pink-950/40",    border: "border-pink-700/40",    dot: "bg-pink-400" },
];

/** Returns a stable color for a person based on their sorted position in the full list. */
export function getPersonColor(personName: string, allNames: string[]): PersonColor {
  const sorted = [...allNames].sort();
  const idx = sorted.indexOf(personName);
  return CALENDAR_PALETTE[(idx < 0 ? 0 : idx) % CALENDAR_PALETTE.length];
}
