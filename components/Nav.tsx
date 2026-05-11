"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { Home, Calendar, ClipboardList, Settings } from "lucide-react";

export default function Nav() {
  const path = usePathname();
  const links = [
    { href: "/", label: "Home", icon: Home },
    { href: "/request", label: "Request", icon: ClipboardList },
    { href: "/schedule", label: "Schedule", icon: Calendar },
    { href: "/admin", label: "Admin", icon: Settings },
  ];
  return (
    <nav className="sticky top-0 z-50 border-b border-[#1e1e1e] bg-[#0b0b0b]/90 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-5 h-15 flex items-center justify-between" style={{height:"58px"}}>
        <Link href="/" className="flex items-center gap-2.5 group">
          <Image src="/ITR_Logo.png" alt="ITR Logo" width={32} height={32} className="rounded-lg" />
          <span className="font-semibold text-[15px] text-white hidden sm:block tracking-tight">
            Elevate Underground
          </span>
        </Link>
        <div className="flex items-center gap-1">
          {links.map(({ href, label, icon: Icon }) => {
            const active = path === href;
            return (
              <Link key={href} href={href} className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-[14px] font-medium transition-all ${
                active ? "bg-[#1c1c1c] text-white border border-[#2a2a2a]" : "text-[#777] hover:text-white hover:bg-[#161616]"
              }`}>
                <Icon size={15} />
                <span className="hidden sm:block">{label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
