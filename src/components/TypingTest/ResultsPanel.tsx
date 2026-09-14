"use client";

import { useEffect, useRef } from "react";
import { FinishStats } from "@/lib/useTypingEngine";
import { Button } from "@/components/ui/Button";

interface ResultsPanelProps {
  stats: FinishStats;
  wpmSamples: number[];
  onRestart: () => void;
}

export function ResultsPanel({ stats, wpmSamples, onRestart }: ResultsPanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.clientWidth || 700;
    const h = 150;
    canvas.width = w * 2;
    canvas.height = h * 2;
    ctx.scale(2, 2);
    ctx.clearRect(0, 0, w, h);

    const samples = wpmSamples.length ? wpmSamples : [stats.wpm];
    const max = Math.max(...samples, 10);

    ctx.strokeStyle = "#FF4B2B";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    samples.forEach((v, i) => {
      const x = (i / Math.max(samples.length - 1, 1)) * w;
      const y = h - (v / max) * (h - 16) - 8;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    ctx.fillStyle = "rgba(255,75,43,0.12)";
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();
  }, [wpmSamples, stats.wpm]);

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="flex gap-12 flex-wrap mb-6">
        <div>
          <div className="text-5xl font-mono font-bold text-accent leading-none">{stats.wpm}</div>
          <div className="text-dim text-xs mt-1 uppercase tracking-wide">wpm</div>
        </div>
        <div>
          <div className="text-5xl font-mono font-bold text-text leading-none">{stats.accuracy}%</div>
          <div className="text-dim text-xs mt-1 uppercase tracking-wide">accuracy</div>
        </div>
      </div>

      <canvas ref={canvasRef} className="w-full h-[150px] block border-2 border-border bg-panel" />

      <div className="flex gap-8 flex-wrap mt-6">
        <Stat label="raw wpm" value={stats.rawWpm} />
        <Stat label="consistency" value={`${stats.consistency}%`} />
        <Stat label="correct/incorrect/extra/missed" value={`${stats.correct}/${stats.incorrect}/${stats.extra}/${stats.missed}`} />
        <Stat label="time" value={`${stats.timeElapsedSec}s`} />
      </div>

      <div className="mt-8">
        <Button onClick={onRestart}>Next test (enter)</Button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <div className="text-xl font-mono font-semibold text-text">{value}</div>
      <div className="text-dim text-[11px] mt-1 uppercase tracking-wide">{label}</div>
    </div>
  );
}
