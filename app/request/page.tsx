import Nav from "@/components/Nav";
import LabRequestForm from "@/components/LabRequestForm";
import Link from "next/link";
import { ArrowLeft, Zap } from "lucide-react";

export default function RequestPage() {
  return (
    <>
      <Nav />
      <main className="max-w-2xl mx-auto px-5 py-12">
        <div className="mb-8 anim-slide">
          <Link href="/" className="inline-flex items-center gap-1.5 text-[13px] text-[#555] hover:text-[#aaa] transition-colors mb-5">
            <ArrowLeft size={13} /> Back to home
          </Link>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-[#c80d0d] flex items-center justify-center">
              <Zap size={17} className="text-white fill-white" />
            </div>
            <span className="text-[13px] uppercase tracking-widest text-[#555]">Illinois Tech Robotics</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2" style={{fontFamily:"var(--font-display)",letterSpacing:".05em"}}>
            LAB ACCESS REQUEST
          </h1>
          <p className="text-[16px] text-[#666]">
            Request that the lab be opened and email the details to Danish automatically.
          </p>
        </div>
        <div className="anim-slide delay-1">
          <LabRequestForm />
        </div>
      </main>
    </>
  );
}
