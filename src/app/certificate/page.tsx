"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { TestResultRecord } from "@/types";
import { Button } from "@/components/ui/Button";

function grade(wpm: number): { label: string; note: string } {
  if (wpm >= 120) return { label: "Elite", note: "Top 0.1% of typists" };
  if (wpm >= 90) return { label: "Expert", note: "Professional transcription speed" };
  if (wpm >= 70) return { label: "Advanced", note: "Well above office average" };
  if (wpm >= 50) return { label: "Proficient", note: "Comfortably above average" };
  if (wpm >= 35) return { label: "Competent", note: "Around the typical office pace" };
  return { label: "Developing", note: "Keep practising - speed follows accuracy" };
}

export default function CertificatePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [best, setBest] = useState<TestResultRecord | null>(null);
  const [totalTests, setTotalTests] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (loading || !user) return;
    api
      .get<{ results: TestResultRecord[]; total: number }>("/api/results/me?limit=50")
      .then((d) => {
        setTotalTests(d.total);
        const top = [...d.results].sort((a, b) => b.wpm - a.wpm)[0] ?? null;
        setBest(top);
      })
      .catch(() => setBest(null));
  }, [user, loading]);

  if (loading || !user) return null;

  if (!best) {
    return (
      <div className="max-w-xl mx-auto">
        <h1 className="font-mono text-2xl font-bold mb-2">Typing certificate</h1>
        <p className="text-dim text-sm">
          Finish at least one test and your certificate will be generated from your best run.
        </p>
      </div>
    );
  }

  const g = grade(best.wpm);
  const issued = new Date(best.createdAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  // Deterministic id from the result, so the same run always shows the same ref.
  const certId = `TF-${best._id.slice(-8).toUpperCase()}`;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="font-mono text-2xl font-bold">Typing certificate</h1>
        <Button variant="secondary" onClick={() => window.print()}>
          Print / save as PDF
        </Button>
      </div>

      <div
        ref={cardRef}
        className="certificate bg-panel border-2 border-accent p-8 sm:p-12 text-center"
      >
        <div className="font-mono text-xs uppercase tracking-[0.3em] text-dim mb-6">
          TypeFlow — Certificate of Typing Proficiency
        </div>

        <div className="text-dim text-sm mb-2">This certifies that</div>
        <div className="font-mono text-3xl font-bold mb-6">{user.username}</div>
        <div className="text-dim text-sm mb-8">achieved a verified typing speed of</div>

        <div className="flex items-end justify-center gap-2 mb-2">
          <span className="font-mono text-7xl font-bold text-accent leading-none">{best.wpm}</span>
          <span className="font-mono text-lg text-dim mb-2">WPM</span>
        </div>
        <div className="font-mono text-sm mb-8">
          {g.label} — <span className="text-dim">{g.note}</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-border border-2 border-border mb-8">
          {[
            ["Accuracy", `${best.accuracy}%`],
            ["Consistency", `${best.consistency}%`],
            ["Mode", `${best.mode} ${best.amount}`],
            ["Tests taken", String(totalTests)],
          ].map(([k, v]) => (
            <div key={k} className="bg-panel p-3">
              <div className="font-mono text-base font-bold">{v}</div>
              <div className="text-dim text-[10px] font-mono uppercase">{k}</div>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-end text-left flex-wrap gap-4">
          <div>
            <div className="text-dim text-[10px] font-mono uppercase">Issued</div>
            <div className="font-mono text-sm">{issued}</div>
          </div>
          <div className="text-right">
            <div className="text-dim text-[10px] font-mono uppercase">Certificate ID</div>
            <div className="font-mono text-sm">{certId}</div>
          </div>
        </div>
      </div>

      <p className="text-dim text-xs font-mono mt-4">
        Generated from your fastest recorded test. Take a faster one and it updates.
      </p>

      {/* Print just the certificate, not the whole app chrome. */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .certificate,
          .certificate * {
            visibility: visible;
          }
          .certificate {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
