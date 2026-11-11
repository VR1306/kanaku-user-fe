"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { EASE_OUT } from "@/constants/motion";
import { formatCompact, formatCurrency } from "@/utils/format";
import type { ReportData } from "../schemas";

const W = 600;
const H = 240;
const PAD = { left: 20, right: 20, top: 24, bottom: 34 };
const PLOT_H = H - PAD.top - PAD.bottom;

/** Income vs expenses: two lines on one scale, with a bubble on the hovered (or highest) point. */
export function ReportChart({ report }: { report: ReportData }) {
  const { series, currency } = report;
  const [hover, setHover] = useState<number | null>(null);

  const max = Math.max(1, ...series.flatMap((p) => [p.income, p.expenses])) * 1.12;
  const x = (i: number) =>
    series.length === 1 ? W / 2 : PAD.left + (i * (W - PAD.left - PAD.right)) / (series.length - 1);
  const y = (v: number) => PAD.top + PLOT_H - (v / max) * PLOT_H;

  const peak = series.reduce((best, p, i) => (p.expenses > series[best].expenses ? i : best), 0);
  const active = hover ?? peak;
  const point = series[active];
  const line = (pick: (p: (typeof series)[number]) => number) =>
    series.map((p, i) => `${x(i)},${y(pick(p))}`).join(" ");
  const base = PAD.top + PLOT_H;
  const labelEvery = Math.ceil(series.length / 8);

  const bubble = formatCompact(point.expenses);
  const bubbleW = Math.max(52, bubble.length * 9 + 18);
  const bx = Math.min(Math.max(x(active), bubbleW / 2 + 4), W - bubbleW / 2 - 4);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`Income and expenses, ${report.periodLabel}`}
      className="h-auto w-full overflow-visible"
    >
      {[0, 0.5, 1].map((t) => (
        <line
          key={t}
          x1={PAD.left}
          x2={W - PAD.right}
          y1={PAD.top + PLOT_H * t}
          y2={PAD.top + PLOT_H * t}
          className={t === 1 ? "stroke-line" : "stroke-line-soft"}
          strokeDasharray={t === 1 ? undefined : "4 4"}
        />
      ))}
      {series.length > 1 ? (
        <motion.polygon
          points={`${x(0)},${base} ${line((p) => p.expenses)} ${x(series.length - 1)},${base}`}
          className="fill-brand"
          initial={{ fillOpacity: 0 }}
          animate={{ fillOpacity: 0.07 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        />
      ) : null}
      <motion.polyline
        points={line((p) => p.income)}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.9, ease: EASE_OUT }}
        fill="none"
        className="stroke-accent"
        strokeWidth={3.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <motion.polyline
        points={line((p) => p.expenses)}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.9, ease: EASE_OUT, delay: 0.1 }}
        fill="none"
        className="stroke-brand"
        strokeWidth={3.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {point.expenses > 0 || point.income > 0 ? (
        <g aria-hidden="true">
          <circle
            cx={x(active)}
            cy={y(point.expenses)}
            r={6}
            className="fill-surface stroke-brand"
            strokeWidth={3}
          />
          <rect
            x={bx - bubbleW / 2}
            y={y(point.expenses) - 34}
            width={bubbleW}
            height={22}
            rx={6}
            className="fill-brand"
          />
          <text
            x={bx}
            y={y(point.expenses) - 19}
            textAnchor="middle"
            fontSize={12}
            fontWeight={700}
            className="fill-on-primary"
          >
            {bubble}
          </text>
        </g>
      ) : null}

      <g fontSize={12} textAnchor="middle" className="fill-muted">
        {series.map((p, i) =>
          i % labelEvery === 0 || i === series.length - 1 ? (
            <text key={p.key} x={x(i)} y={H - 10}>
              {p.label}
            </text>
          ) : null,
        )}
      </g>

      {series.map((p, i) => {
        const w = (W - PAD.left - PAD.right) / Math.max(1, series.length - 1);
        return (
          <rect
            key={p.key}
            x={x(i) - w / 2}
            y={0}
            width={w}
            height={H}
            fill="transparent"
            tabIndex={0}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            onFocus={() => setHover(i)}
            onBlur={() => setHover(null)}
          >
            <title>{`${p.label}: income ${formatCurrency(p.income, currency)}, expenses ${formatCurrency(p.expenses, currency)}`}</title>
          </rect>
        );
      })}
    </svg>
  );
}
