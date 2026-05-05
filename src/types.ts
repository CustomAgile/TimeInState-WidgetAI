/**
 * Copyright (c) 2026 Custom Agile LLC. All rights reserved.
 */

import type { WidgetSettings } from '@customagile/widget-ai/components/settings';

// ── Artifact type definitions ──────────────────────────────────────────

/**
 * Supported artifact types. Maps to Lookback API _TypeHierarchy values
 * and the field used to identify state transitions.
 */
export interface ArtifactTypeConfig {
  /** Human-readable label shown in the UI */
  name: string;
  /** WSAPI type path used in Lookback queries (e.g. "HierarchicalRequirement") */
  lbapi: string;
  /** The state field on this artifact type (e.g. "ScheduleState", "State") */
  field: string;
  /** WSAPI type path for WSAPI queries (e.g. "hierarchicalrequirement") */
  wsapi: string;
}

export const ARTIFACT_TYPES: ArtifactTypeConfig[] = [
  { name: 'Stories',      wsapi: 'hierarchicalrequirement', lbapi: 'HierarchicalRequirement', field: 'ScheduleState' },
  { name: 'Defects',      wsapi: 'defect',                  lbapi: 'Defect',                  field: 'ScheduleState' },
  { name: 'Tasks',        wsapi: 'task',                    lbapi: 'Task',                    field: 'State' },
  { name: 'TestCases',    wsapi: 'testcase',                lbapi: 'TestCase',                field: 'LastVerdict' },
  { name: 'Portfolio',    wsapi: 'portfolioitem',           lbapi: 'PortfolioItem',           field: 'State' },
];

// ── Data shapes ────────────────────────────────────────────────────────

/**
 * Per-artifact time spent in each state (in milliseconds).
 * The key is the state name (e.g. "Defined", "In-Progress"), value is ms.
 */
export type StateDurations = Record<string, number>;

/**
 * A single row in the time-in-state output: one artifact and its
 * cumulative time in each state over the query window.
 */
export interface ArtifactTimeInState {
  ObjectID: number;
  FormattedID: string;
  Name: string;
  /** Map of stateName → total milliseconds in that state */
  durations: StateDurations;
}

/**
 * Summary statistics for one state across all artifacts.
 * Used to populate the box-plot chart.
 */
export interface StateStats {
  stateName: string;
  /** Minimum days any artifact spent in this state (filtered: > 1 hour) */
  min: number;
  /** 25th percentile in days */
  p25: number;
  /** Mean (average) in days */
  mean: number;
  /** 75th percentile in days */
  p75: number;
  /** Maximum days any artifact spent in this state */
  max: number;
  /** Number of artifacts contributing to the stats */
  count: number;
}

// ── Settings ───────────────────────────────────────────────────────────

export interface TimeInStateSettings extends WidgetSettings {
  /** WSAPI artifact type ref (e.g. "hierarchicalrequirement") */
  artifactType: string;
  /** Comma-separated list of state values to include (empty = all) */
  selectedStates: string;
  /** ISO date string for start of the analysis window */
  startDate: string;
  /** ISO date string for end of the analysis window */
  endDate: string;
}

// ── DataProvider interface ─────────────────────────────────────────────

export interface TimeInStateDataProvider {
  /**
   * Fetch Lookback snapshots and compute per-artifact, per-state durations.
   *
   * @param artifactTypeLbapi  Lookback type name (e.g. "HierarchicalRequirement")
   * @param stateField         Field that tracks state (e.g. "ScheduleState")
   * @param startDate          ISO date string for window start
   * @param endDate            ISO date string for window end
   * @param stateFilter        If non-empty, only include these state values
   */
  fetchTimeInState(
    artifactTypeLbapi: string,
    stateField: string,
    startDate: string,
    endDate: string,
    stateFilter: string[],
  ): Promise<ArtifactTimeInState[]>;
}
