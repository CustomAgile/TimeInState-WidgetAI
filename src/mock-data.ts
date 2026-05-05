/**
 * Copyright (c) 2026 Custom Agile LLC. All rights reserved.
 */

import { DEFAULT_RALLY_CONTEXT } from '@customagile/widget-ai/types/rally-context';
import type { RallyContext } from '@customagile/widget-ai/types/rally-context';
import type { TimeInStateDataProvider, ArtifactTimeInState } from './types';

// ── Helpers ────────────────────────────────────────────────────────────

const DAY_MS = 86_400_000;

function days(n: number): number {
  return Math.round(n * DAY_MS);
}

function makeArtifact(
  oid: number,
  fid: string,
  name: string,
  durations: Record<string, number>,
): ArtifactTimeInState {
  return { ObjectID: oid, FormattedID: fid, Name: name, durations };
}

// ── Mock story dataset — realistic ScheduleState durations ────────────
//
// 12 user stories with realistic time-in-state distributions for a sprint cycle.
// Durations reflect common real-world patterns:
//   - Defined: 1–5 days (backlog sitting time)
//   - In-Progress: 2–8 days (active development)
//   - Completed: 0.5–2 days (waiting for acceptance)
//   - Accepted: 0–1 day (fast acceptance)

const MOCK_STORIES: ArtifactTimeInState[] = [
  makeArtifact(1001, 'US1001', 'Add SSO login via SAML',
    { Defined: days(3.2), 'In-Progress': days(5.1), Completed: days(1.2), Accepted: days(0.5) }),

  makeArtifact(1002, 'US1002', 'Customer API rate limiting',
    { Defined: days(1.8), 'In-Progress': days(7.3), Completed: days(0.8) }),

  makeArtifact(1003, 'US1003', 'Export data to CSV',
    { Defined: days(4.5), 'In-Progress': days(2.9), Completed: days(1.5), Accepted: days(0.3) }),

  makeArtifact(1004, 'US1004', 'Offline mode for mobile app',
    { Defined: days(5.0), 'In-Progress': days(8.2), Completed: days(2.1), Accepted: days(0.7) }),

  makeArtifact(1005, 'US1005', 'GDPR data retention policy',
    { Defined: days(2.1), 'In-Progress': days(4.8), Completed: days(1.9), Accepted: days(0.4) }),

  makeArtifact(1006, 'US1006', 'Bulk import wizard',
    { Defined: days(3.7), 'In-Progress': days(6.4), Completed: days(0.6) }),

  makeArtifact(1007, 'US1007', 'Real-time push notifications',
    { Defined: days(1.5), 'In-Progress': days(3.3), Completed: days(1.1), Accepted: days(0.2) }),

  makeArtifact(1008, 'US1008', 'Dashboard performance optimization',
    { Defined: days(4.2), 'In-Progress': days(9.1), Completed: days(1.7), Accepted: days(0.6) }),

  makeArtifact(1009, 'US1009', 'Self-service password reset',
    { Defined: days(0.9), 'In-Progress': days(2.5), Completed: days(0.5), Accepted: days(0.1) }),

  makeArtifact(1010, 'US1010', 'Audit log viewer',
    { Defined: days(3.0), 'In-Progress': days(5.7), Completed: days(2.3), Accepted: days(0.8) }),

  makeArtifact(1011, 'US1011', 'Multi-tenant workspace isolation',
    { Defined: days(6.1), 'In-Progress': days(11.4), Completed: days(1.8), Accepted: days(0.5) }),

  makeArtifact(1012, 'US1012', 'Webhook outbound integrations',
    { Defined: days(2.4), 'In-Progress': days(4.0), Completed: days(0.9) }),
];

// ── Mock defect dataset — ScheduleState durations ─────────────────────

const MOCK_DEFECTS: ArtifactTimeInState[] = [
  makeArtifact(2001, 'DE2001', 'Login redirect loop on Safari',
    { Defined: days(1.1), 'In-Progress': days(2.3), Completed: days(0.4), Accepted: days(0.2) }),
  makeArtifact(2002, 'DE2002', 'Export crashes on empty dataset',
    { Defined: days(0.8), 'In-Progress': days(1.7), Completed: days(0.3) }),
  makeArtifact(2003, 'DE2003', 'Notification emails not sent on holiday',
    { Defined: days(2.5), 'In-Progress': days(3.1), Completed: days(1.0), Accepted: days(0.3) }),
  makeArtifact(2004, 'DE2004', 'Pagination breaks on >1000 items',
    { Defined: days(1.4), 'In-Progress': days(4.2), Completed: days(0.7) }),
  makeArtifact(2005, 'DE2005', 'Slow query on report dashboard',
    { Defined: days(3.2), 'In-Progress': days(6.5), Completed: days(1.3), Accepted: days(0.4) }),
];

// ── Mock task dataset — Task.State durations ──────────────────────────

const MOCK_TASKS: ArtifactTimeInState[] = [
  makeArtifact(3001, 'TA3001', 'Write unit tests for auth module',
    { Defined: days(0.5), 'In-Progress': days(1.8), Completed: days(0.2) }),
  makeArtifact(3002, 'TA3002', 'Update OpenAPI spec',
    { Defined: days(1.2), 'In-Progress': days(0.9), Completed: days(0.1) }),
  makeArtifact(3003, 'TA3003', 'DB migration for new schema',
    { Defined: days(2.0), 'In-Progress': days(3.4), Completed: days(0.5) }),
  makeArtifact(3004, 'TA3004', 'Code review — export feature',
    { Defined: days(0.3), 'In-Progress': days(0.7), Completed: days(0.1) }),
  makeArtifact(3005, 'TA3005', 'Deploy to staging',
    { Defined: days(0.8), 'In-Progress': days(1.1), Completed: days(0.2) }),
];

// ── Artifact dataset by lbapi type ────────────────────────────────────

const MOCK_DATA_BY_LBAPI: Record<string, ArtifactTimeInState[]> = {
  HierarchicalRequirement: MOCK_STORIES,
  Defect: MOCK_DEFECTS,
  Task: MOCK_TASKS,
  TestCase: [
    makeArtifact(4001, 'TC4001', 'Verify SSO flow end-to-end', { Pass: days(0.3) }),
    makeArtifact(4002, 'TC4002', 'Export with 10k rows', { Fail: days(0.5), Pass: days(0.4) }),
    makeArtifact(4003, 'TC4003', 'API rate limit enforcement', { Blocked: days(1.2), Pass: days(0.3) }),
  ],
  PortfolioItem: [
    makeArtifact(5001, 'F5001', 'Authentication Platform',
      { Defined: days(14), 'In-Progress': days(32), Completed: days(5), Accepted: days(2) }),
    makeArtifact(5002, 'F5002', 'Data Export Suite',
      { Defined: days(8), 'In-Progress': days(21), Completed: days(4) }),
    makeArtifact(5003, 'F5003', 'Mobile Offline Mode',
      { Defined: days(21), 'In-Progress': days(45), Completed: days(7), Accepted: days(3) }),
  ],
};

// ── Mock provider ─────────────────────────────────────────────────────

export const mockProvider: TimeInStateDataProvider = {
  async fetchTimeInState(artifactTypeLbapi, stateField, _startDate, _endDate, stateFilter) {
    const data = MOCK_DATA_BY_LBAPI[artifactTypeLbapi] ?? MOCK_STORIES;

    if (stateFilter.length === 0) return data;

    // Apply state filter: keep artifacts that have at least one matching state
    return data
      .map((artifact) => {
        const filtered: Record<string, number> = {};
        for (const state of stateFilter) {
          if (artifact.durations[state] !== undefined) {
            filtered[state] = artifact.durations[state];
          }
        }
        return { ...artifact, durations: filtered };
      })
      .filter((a) => Object.keys(a.durations).length > 0);
  },

};

// ── Mock context ──────────────────────────────────────────────────────

// Default date window: 90 days ago to today
const now = new Date();
const ninetyDaysAgo = new Date(now.getTime() - 90 * 86_400_000);

export const mockContext: RallyContext = {
  ...DEFAULT_RALLY_CONTEXT,
  User: {
    _ref: '/user/999',
    DisplayName: 'Mock User',
    EmailAddress: 'mock@example.com',
    UserName: 'mockuser',
    ObjectID: 999,
  },
  WidgetName: 'Time In State',
  WidgetUUID: 'mock-time-in-state-uuid',
  isEditMode: false,
  Settings: {
    artifactType: 'hierarchicalrequirement',
    selectedStates: '',
    startDate: ninetyDaysAgo.toISOString().slice(0, 10),
    endDate: now.toISOString().slice(0, 10),
  },
};
