/**
 * Copyright (c) 2026 Custom Agile LLC. All rights reserved.
 */

import { useState, useEffect, useCallback } from 'react';
import type { TimeInStateDataProvider, ArtifactTimeInState, StateStats } from '../types';
import { ARTIFACT_TYPES } from '../types';

// ── Constants ─────────────────────────────────────────────────────────

const DAY_MS = 86_400_000;

// ── Hook ──────────────────────────────────────────────────────────────

export interface UseTimeInStateResult {
  artifacts: ArtifactTimeInState[];
  stateStats: StateStats[];
  /** All state names observed in the data (for table column headers) */
  stateColumns: string[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useTimeInStateData(
  data: TimeInStateDataProvider,
  artifactTypeWsapi: string,
  startDate: string,
  endDate: string,
  stateFilter: string[],
): UseTimeInStateResult {
  const [artifacts, setArtifacts] = useState<ArtifactTimeInState[]>([]);
  const [stateStats, setStateStats] = useState<StateStats[]>([]);
  const [stateColumns, setStateColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;

    const typeConfig = ARTIFACT_TYPES.find((t) => t.wsapi === artifactTypeWsapi);
    if (!typeConfig) {
      setError(`Unknown artifact type: ${artifactTypeWsapi}`);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    data
      .fetchTimeInState(
        typeConfig.lbapi,
        typeConfig.field,
        startDate,
        endDate,
        stateFilter,
      )
      .then((results) => {
        if (cancelled) return;

        // Determine column order — use stateFilter order if provided, else derive from data
        let columnOrder: string[];
        if (stateFilter.length > 0) {
          columnOrder = stateFilter;
        } else {
          const seen = new Set<string>();
          for (const a of results) {
            for (const state of Object.keys(a.durations)) seen.add(state);
          }
          columnOrder = Array.from(seen).sort();
        }

        // Compute box-plot stats (min, p25, mean, p75, max) for each state.
        // Mirrors the legacy ExtJS `_gotSnapShots` aggregation.
        const byState = new Map<string, number[]>();
        for (const artifact of results) {
          for (const [state, ms] of Object.entries(artifact.durations)) {
            const days = ms / DAY_MS;
            if (!byState.has(state)) byState.set(state, []);
            byState.get(state)!.push(days);
          }
        }

        const stats: StateStats[] = [];
        for (const [stateName, values] of byState.entries()) {
          if (values.length === 0) continue;
          const sorted = [...values].sort((a, b) => a - b);
          const n = sorted.length;
          const sum = sorted.reduce((acc, v) => acc + v, 0);
          stats.push({
            stateName,
            min: sorted[0],
            p25: sorted[Math.floor(0.25 * n)] ?? sorted[0],
            mean: sum / n,
            p75: sorted[Math.floor(0.75 * n)] ?? sorted[n - 1],
            max: sorted[n - 1],
            count: n,
          });
        }

        // Sort by columnOrder, then alphabetically
        stats.sort((a, b) => {
          const ia = columnOrder.indexOf(a.stateName);
          const ib = columnOrder.indexOf(b.stateName);
          if (ia >= 0 && ib >= 0) return ia - ib;
          if (ia >= 0) return -1;
          if (ib >= 0) return 1;
          return a.stateName.localeCompare(b.stateName);
        });

        setArtifacts(results);
        setStateStats(stats);
        setStateColumns(columnOrder);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load data');
        setLoading(false);
      });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, artifactTypeWsapi, startDate, endDate, stateFilter.join(','), tick]);

  return { artifacts, stateStats, stateColumns, loading, error, refresh };
}
