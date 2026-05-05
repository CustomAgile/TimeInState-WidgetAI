/**
 * Copyright (c) 2026 Custom Agile LLC. All rights reserved.
 */

import React from 'react';
import type { ArtifactTimeInState } from '../types';

// ── Helpers ────────────────────────────────────────────────────────────

const DAY_MS = 86_400_000;

function msToDisplay(ms: number): string {
  const days = ms / DAY_MS;
  if (days < 1) return `${(days * 24).toFixed(1)}h`;
  return `${days.toFixed(1)}d`;
}

// ── ArtifactTable ──────────────────────────────────────────────────────

export interface ArtifactTableProps {
  artifacts: ArtifactTimeInState[];
  /** Ordered state columns to display */
  stateColumns: string[];
  rallyBaseUrl?: string;
}

export function ArtifactTable({ artifacts, stateColumns, rallyBaseUrl }: ArtifactTableProps) {
  if (artifacts.length === 0) {
    return (
      <div style={{
        padding: 'var(--ca-space-6)',
        textAlign: 'center',
        color: 'var(--ca-text-secondary)',
        fontSize: 'var(--ca-font-size-sm)',
      }}>
        No artifacts found for the selected criteria.
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto', overflowY: 'auto', flex: 1 }}>
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: 'var(--ca-font-size-sm)',
        color: 'var(--ca-text-primary)',
      }}>
        <thead>
          <tr style={{
            backgroundColor: 'var(--ca-surface-raised)',
            borderBottom: '2px solid var(--ca-border-default)',
          }}>
            <th style={{ ...TH_STYLE, width: 90, textAlign: 'left' }}>ID</th>
            <th style={{ ...TH_STYLE, textAlign: 'left', minWidth: 200 }}>Name</th>
            {stateColumns.map((state) => (
              <th key={state} style={{ ...TH_STYLE, width: 100, textAlign: 'right' }}>
                {state}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {artifacts.map((artifact, i) => (
            <tr
              key={artifact.ObjectID}
              style={{
                backgroundColor: i % 2 === 0
                  ? 'var(--ca-surface-page)'
                  : 'var(--ca-surface-raised)',
                borderBottom: '1px solid var(--ca-border-subtle)',
              }}
            >
              <td style={TD_STYLE}>
                {rallyBaseUrl ? (
                  <a
                    href={`${rallyBaseUrl}/#/detail/hierarchicalrequirement/${artifact.ObjectID}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: 'var(--ca-text-link)', textDecoration: 'none' }}
                  >
                    {artifact.FormattedID}
                  </a>
                ) : (
                  artifact.FormattedID
                )}
              </td>
              <td style={{ ...TD_STYLE, fontWeight: 500 }}>{artifact.Name}</td>
              {stateColumns.map((state) => {
                const ms = artifact.durations[state];
                return (
                  <td key={state} style={{ ...TD_STYLE, textAlign: 'right' }}>
                    {ms !== undefined ? msToDisplay(ms) : (
                      <span style={{ color: 'var(--ca-text-disabled)' }}>—</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Shared cell styles ─────────────────────────────────────────────────

const TH_STYLE: React.CSSProperties = {
  padding: '6px 10px',
  fontSize: 'var(--ca-font-size-xs)',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.4px',
  color: 'var(--ca-text-secondary)',
  whiteSpace: 'nowrap',
};

const TD_STYLE: React.CSSProperties = {
  padding: '6px 10px',
  verticalAlign: 'middle',
  whiteSpace: 'nowrap',
};
