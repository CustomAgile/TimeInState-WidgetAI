/**
 * Copyright (c) 2026 Custom Agile LLC. All rights reserved.
 */

import type { RallyContext } from '@customagile/widget-ai/types/rally-context';
import { queryLookback } from '@customagile/widget-ai/data/lookback';
import type { LookbackSnapshot } from '@customagile/widget-ai/data/lookback';

import type {
  TimeInStateDataProvider,
  ArtifactTimeInState,
  StateDurations,
} from './types';

// ── Lookback snapshot aggregation ─────────────────────────────────────

/**
 * Aggregate Lookback snapshots into per-artifact, per-state durations.
 *
 * Logic mirrors the legacy ExtJS app's `_gotSnapShots`:
 * - Group snapshots by (ObjectID, stateValue)
 * - Accumulate (ValidTo - ValidFrom) milliseconds across snapshots for the same pair
 * - Skip any accumulated durations <= 1 hour (3,600,000 ms) as noise
 */
function aggregateSnapshots(
  snapshots: LookbackSnapshot[],
  stateField: string,
  stateFilter: string[],
): ArtifactTimeInState[] {
  // Map: ObjectID -> { FormattedID, Name, durations }
  const byOid = new Map<number, {
    FormattedID: string;
    Name: string;
    durations: StateDurations;
  }>();

  for (const snap of snapshots) {
    const oid = snap.ObjectID;
    const stateValue = (snap[stateField] as string | undefined) ?? '';
    const displayState = stateValue === '' ? 'None' : stateValue;

    // If a state filter is active, skip states not in the list
    if (stateFilter.length > 0 && !stateFilter.includes(displayState)) continue;

    const validFrom = new Date(snap._ValidFrom as string).getTime();
    const validTo = new Date(snap._ValidTo as string).getTime();
    const duration = validTo - validFrom;

    let entry = byOid.get(oid);
    if (!entry) {
      entry = {
        FormattedID: (snap.FormattedID as string | undefined) ?? String(oid),
        Name: (snap.Name as string | undefined) ?? '',
        durations: {},
      };
      byOid.set(oid, entry);
    }

    entry.durations[displayState] = (entry.durations[displayState] ?? 0) + duration;
  }

  const MIN_DURATION_MS = 3_600_000; // 1 hour — skip noise

  return Array.from(byOid.entries()).map(([oid, entry]) => {
    // Filter out sub-hour state buckets per legacy logic
    const filteredDurations: StateDurations = {};
    for (const [state, ms] of Object.entries(entry.durations)) {
      if (ms > MIN_DURATION_MS) {
        filteredDurations[state] = ms;
      }
    }
    return {
      ObjectID: oid,
      FormattedID: entry.FormattedID,
      Name: entry.Name,
      durations: filteredDurations,
    };
  }).filter((a) => Object.keys(a.durations).length > 0);
}

// ── createRallyProvider ────────────────────────────────────────────────

export function createRallyProvider(ctx: RallyContext): TimeInStateDataProvider {
  return {
    async fetchTimeInState(artifactTypeLbapi, stateField, startDate, endDate, stateFilter) {
      const snapshots = await queryLookback(ctx, {
        find: {
          _TypeHierarchy: artifactTypeLbapi,
          _ValidFrom: { $gt: startDate },
          _ValidTo: { $lt: endDate },
        },
        fields: ['ObjectID', 'FormattedID', 'Name', '_ValidFrom', '_ValidTo', stateField],
        hydrate: [stateField],
        pagesize: 2000,
      });

      return aggregateSnapshots(snapshots, stateField, stateFilter);
    },

  };
}
