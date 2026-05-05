/**
 * Copyright (c) 2026 Custom Agile LLC. All rights reserved.
 */

import React from 'react';
import type { StateStats } from '../types';

// ── Helpers ────────────────────────────────────────────────────────────

function fmt(days: number): string {
  if (days < 1) return `${(days * 24).toFixed(1)}h`;
  return `${days.toFixed(1)}d`;
}

// ── BoxPlotBar — one box-plot bar for a single state ───────────────────

interface BoxPlotBarProps {
  stats: StateStats;
  maxDays: number;
}

function BoxPlotBar({ stats, maxDays }: BoxPlotBarProps) {
  const totalWidth = 400; // SVG coordinate units

  // Convert day values to x-coordinates scaled to totalWidth
  const scale = (v: number) => Math.min((v / maxDays) * totalWidth, totalWidth);

  const xMin = scale(stats.min);
  const xP25 = scale(stats.p25);
  const xMean = scale(stats.mean);
  const xP75 = scale(stats.p75);
  const xMax = scale(stats.max);

  const boxY = 8;
  const boxH = 24;
  const midY = boxY + boxH / 2;

  return (
    <div style={{ marginBottom: 16 }}>
      {/* State label row */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: 4,
      }}>
        <span style={{
          fontSize: 'var(--ca-font-size-sm)',
          fontWeight: 600,
          color: 'var(--ca-text-primary)',
          minWidth: 120,
        }}>
          {stats.stateName}
        </span>
        <span style={{
          fontSize: 'var(--ca-font-size-xs)',
          color: 'var(--ca-text-secondary)',
        }}>
          {stats.count} artifact{stats.count !== 1 ? 's' : ''} &nbsp;|&nbsp;
          Min: {fmt(stats.min)} &nbsp; Avg: {fmt(stats.mean)} &nbsp; Max: {fmt(stats.max)}
        </span>
      </div>

      {/* SVG box-plot */}
      <svg
        viewBox={`0 0 ${totalWidth} 40`}
        width="100%"
        height={40}
        aria-label={`Box plot for ${stats.stateName}: min ${fmt(stats.min)}, 25th pct ${fmt(stats.p25)}, mean ${fmt(stats.mean)}, 75th pct ${fmt(stats.p75)}, max ${fmt(stats.max)}`}
        style={{ display: 'block' }}
      >
        {/* Whisker line: min to max */}
        <line
          x1={xMin} y1={midY}
          x2={xMax} y2={midY}
          stroke="var(--ca-border-default)"
          strokeWidth={1.5}
        />

        {/* Min cap */}
        <line
          x1={xMin} y1={boxY + 4}
          x2={xMin} y2={boxY + boxH - 4}
          stroke="var(--ca-text-secondary)"
          strokeWidth={2}
        />

        {/* Max cap */}
        <line
          x1={xMax} y1={boxY + 4}
          x2={xMax} y2={boxY + boxH - 4}
          stroke="var(--ca-text-secondary)"
          strokeWidth={2}
        />

        {/* IQR box (p25–p75) */}
        <rect
          x={xP25} y={boxY}
          width={Math.max(xP75 - xP25, 2)} height={boxH}
          fill="var(--ca-status-blue-bg, rgba(2, 118, 192, 0.15))"
          stroke="var(--ca-status-blue, #0276C0)"
          strokeWidth={1.5}
          rx={3}
        />

        {/* Mean line */}
        <line
          x1={xMean} y1={boxY}
          x2={xMean} y2={boxY + boxH}
          stroke="var(--ca-status-blue, #0276C0)"
          strokeWidth={2.5}
        />
      </svg>
    </div>
  );
}

// ── StateBarChart ──────────────────────────────────────────────────────

export interface StateBarChartProps {
  stats: StateStats[];
}

export function StateBarChart({ stats }: StateBarChartProps) {
  if (stats.length === 0) {
    return (
      <div style={{
        padding: 'var(--ca-space-6)',
        textAlign: 'center',
        color: 'var(--ca-text-secondary)',
        fontSize: 'var(--ca-font-size-sm)',
      }}>
        No data to display. Try broadening the date range or selecting different states.
      </div>
    );
  }

  const maxDays = Math.max(...stats.map((s) => s.max), 1);

  return (
    <div style={{ padding: 'var(--ca-space-3) var(--ca-space-2)' }}>
      {/* Legend */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        marginBottom: 16,
        fontSize: 'var(--ca-font-size-xs)',
        color: 'var(--ca-text-secondary)',
      }}>
        <span>
          <svg viewBox="0 0 14 14" width={14} height={14} style={{ verticalAlign: 'middle', marginRight: 4 }}>
            <line x1={1} y1={7} x2={13} y2={7} stroke="var(--ca-border-default)" strokeWidth={1.5} />
          </svg>
          Whiskers = Min / Max
        </span>
        <span>
          <svg viewBox="0 0 14 14" width={14} height={14} style={{ verticalAlign: 'middle', marginRight: 4 }}>
            <rect x={1} y={3} width={12} height={8}
              fill="var(--ca-status-blue-bg, rgba(2, 118, 192, 0.15))"
              stroke="var(--ca-status-blue, #0276C0)" strokeWidth={1} rx={2} />
          </svg>
          Box = 25th–75th pct
        </span>
        <span>
          <svg viewBox="0 0 14 14" width={14} height={14} style={{ verticalAlign: 'middle', marginRight: 4 }}>
            <line x1={7} y1={2} x2={7} y2={12} stroke="var(--ca-status-blue, #0276C0)" strokeWidth={2.5} />
          </svg>
          Line = Average
        </span>
      </div>

      {stats.map((s) => (
        <BoxPlotBar key={s.stateName} stats={s} maxDays={maxDays} />
      ))}
    </div>
  );
}
