"use client";

import { m as motion } from "framer-motion";
import { TRANSITION } from "@/constants/motion";

export type DonutSegment = { id: string; percent: number; color: string; label: string };

type DonutChartProps = {
  segments: DonutSegment[];
  centerLabel: string;
  centerValue: string;
  size?: number;
};

/** Donut built from stroke-dasharray arcs on a circle of circumference 100. */
export function DonutChart({ segments, centerLabel, centerValue, size = 170 }: DonutChartProps) {
  // Each arc starts where the previous one ended; 25 puts the first at 12 o'clock.
  const offsets = segments.map(
    (_, i) => 25 - segments.slice(0, i).reduce((sum, s) => sum + s.percent, 0),
  );
  return (
    <svg
      viewBox="0 0 42 42"
      width={size}
      height={size}
      role="img"
      aria-label={`${centerLabel} ${centerValue}: ${segments.map((s) => `${s.label} ${s.percent}%`).join(", ")}`}
    >
      <circle
        cx="21"
        cy="21"
        r="15.915"
        fill="none"
        stroke="var(--color-line-soft)"
        strokeWidth="6"
      />
      {segments.map((s, i) => {
        return (
          <motion.circle
            key={s.id}
            cx="21"
            cy="21"
            r="15.915"
            fill="none"
            stroke={s.color}
            strokeWidth="6"
            strokeDashoffset={offsets[i]}
            initial={{ strokeDasharray: "0 100" }}
            animate={{ strokeDasharray: `${s.percent} ${100 - s.percent}` }}
            transition={{ ...TRANSITION, delay: 0.1 + i * 0.07 }}
          >
            <title>{`${s.label}: ${s.percent}%`}</title>
          </motion.circle>
        );
      })}
      <text x="21" y="20" textAnchor="middle" fontSize="3.2" fill="var(--color-muted)">
        {centerLabel}
      </text>
      <text
        x="21"
        y="25.5"
        textAnchor="middle"
        fontSize="5.4"
        fontWeight="700"
        fill="var(--color-link)"
      >
        {centerValue}
      </text>
    </svg>
  );
}
