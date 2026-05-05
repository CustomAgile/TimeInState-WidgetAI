/**
 * Copyright (c) 2026 Custom Agile LLC. All rights reserved.
 */

import React, { useState } from 'react';
import '@customagile/widget-ai/styles/rally-app-tokens.css';

import type { RallyContext } from '@customagile/widget-ai/types/rally-context';
import { AppHeader } from '@customagile/widget-ai/components/AppHeader';
import { EditModePanel, SettingRow } from '@customagile/widget-ai/components/EditModePanel';
import { useWidgetSettings, defineWidgetSettings } from '@customagile/widget-ai/components/settings';

import type { TimeInStateDataProvider, TimeInStateSettings } from './types';
import { ARTIFACT_TYPES } from './types';
import { StateBarChart } from './components/StateBarChart';
import { ArtifactTable } from './components/ArtifactTable';
import { useTimeInStateData } from './components/useTimeInStateData';

// ── Constants ──────────────────────────────────────────────────────────

// Default date window: 90 days ago to today (computed once at module init)
function defaultStartDate(): string {
  const d = new Date(Date.now() - 90 * 86_400_000);
  return d.toISOString().slice(0, 10);
}

function defaultEndDate(): string {
  return new Date().toISOString().slice(0, 10);
}

const SETTINGS_DEFAULTS = defineWidgetSettings<TimeInStateSettings>({
  artifactType: 'hierarchicalrequirement',
  selectedStates: '',
  startDate: defaultStartDate(),
  endDate: defaultEndDate(),
});

// ── App component ──────────────────────────────────────────────────────

interface AppProps {
  rallyContext: RallyContext;
  data: TimeInStateDataProvider;
}

type ViewTab = 'chart' | 'table';

export default function App({ rallyContext, data }: AppProps) {
  // ── Settings ───────────────────────────────────────────────────────
  const { settings, updateSetting, updateSettings } = useWidgetSettings<TimeInStateSettings>(
    rallyContext,
    SETTINGS_DEFAULTS,
  );

  // ── View tab ───────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<ViewTab>('chart');

  // ── Derived state filters ──────────────────────────────────────────
  const raw = settings.selectedStates ?? '';
  const stateFilter = raw.trim() === '' ? [] : raw.split(',').map((s) => s.trim()).filter(Boolean);

  // ── Data ───────────────────────────────────────────────────────────
  const { artifacts, stateStats, stateColumns, loading, error, refresh } = useTimeInStateData(
    data,
    settings.artifactType ?? 'hierarchicalrequirement',
    settings.startDate ?? defaultStartDate(),
    settings.endDate ?? defaultEndDate(),
    stateFilter,
  );

  // ── Current artifact type config ───────────────────────────────────
  const typeConfig = ARTIFACT_TYPES.find((t) => t.wsapi === (settings.artifactType ?? 'hierarchicalrequirement'));

  // ── EditMode render ────────────────────────────────────────────────
  if (rallyContext.isEditMode) {
    return (
      <EditModePanel
        appName="Time In State"
        version="0.1.0"
        appSlug="time-in-state"
        settings={settings as unknown as Record<string, unknown>}
        onSave={(dirty: Partial<TimeInStateSettings>) => updateSettings(dirty)}
        onClose={() => { /* Rally controls EditMode exit */ }}
      >
        <SettingRow label="Artifact Type" settingKey="artifactType">
          <select
            value={settings.artifactType ?? 'hierarchicalrequirement'}
            onChange={(e) => updateSetting('artifactType', e.target.value)}
            style={selectStyle}
          >
            {ARTIFACT_TYPES.map((t) => (
              <option key={t.wsapi} value={t.wsapi}>{t.name}</option>
            ))}
          </select>
        </SettingRow>

        <SettingRow label="Start Date" settingKey="startDate">
          <input
            type="date"
            value={settings.startDate ?? defaultStartDate()}
            onChange={(e) => updateSetting('startDate', e.target.value)}
            style={inputStyle}
          />
        </SettingRow>

        <SettingRow label="End Date" settingKey="endDate">
          <input
            type="date"
            value={settings.endDate ?? defaultEndDate()}
            onChange={(e) => updateSetting('endDate', e.target.value)}
            style={inputStyle}
          />
        </SettingRow>

        <SettingRow label="States to Show (comma-separated)" settingKey="selectedStates">
          <input
            type="text"
            value={settings.selectedStates ?? ''}
            onChange={(e) => updateSetting('selectedStates', e.target.value)}
            placeholder="e.g. Defined, In-Progress, Completed"
            style={inputStyle}
          />
          <div style={{
            marginTop: 4,
            fontSize: 'var(--ca-font-size-xs)',
            color: 'var(--ca-text-secondary)',
          }}>
            Leave empty to show all states.
          </div>
        </SettingRow>
      </EditModePanel>
    );
  }

  // ── Normal view ────────────────────────────────────────────────────
  const typeName = typeConfig?.name ?? 'Stories';
  const titleSuffix = settings.startDate && settings.endDate
    ? ` — ${settings.startDate} to ${settings.endDate}`
    : '';

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      fontFamily: 'var(--ca-font-family)',
      backgroundColor: 'var(--ca-surface-page)',
      color: 'var(--ca-text-primary)',
      overflow: 'hidden',
    }}>
      <AppHeader
        title="Time In State"
        help={{
          content: (
            <>
              <p>
                Shows how long each {typeName.slice(0, -1).toLowerCase()} spent in each workflow
                state over the selected date window. Only durations longer than 1 hour are counted.
              </p>
              <p>
                <strong>Chart tab:</strong> Box plot showing Min, 25th pct, Average (line), 75th pct,
                and Max for each state across all artifacts.
              </p>
              <p>
                <strong>Table tab:</strong> Per-artifact view with time in each state shown in days or hours.
              </p>
              <p>
                Use Edit Mode to change the artifact type, date range, or state filter.
              </p>
            </>
          ),
        }}
      >
        {/* Refresh button */}
        <button
          onClick={refresh}
          disabled={loading}
          title="Reload data"
          aria-label="Reload data"
          style={{
            padding: '4px 10px',
            fontSize: 'var(--ca-font-size-sm)',
            cursor: loading ? 'default' : 'pointer',
            border: '1px solid var(--ca-border-default)',
            borderRadius: 'var(--ca-radius-sm)',
            backgroundColor: 'var(--ca-surface-raised)',
            color: 'var(--ca-text-primary)',
            opacity: loading ? 0.5 : 1,
          }}
        >
          ↻ Refresh
        </button>
      </AppHeader>

      {/* Sub-header: type + date range label */}
      <div style={{
        padding: '4px 12px',
        fontSize: 'var(--ca-font-size-xs)',
        color: 'var(--ca-text-secondary)',
        borderBottom: '1px solid var(--ca-border-subtle)',
        backgroundColor: 'var(--ca-surface-raised)',
      }}>
        {typeName}{titleSuffix}
        {stateFilter.length > 0 && (
          <span style={{ marginLeft: 8 }}>
            • Filtered: {stateFilter.join(', ')}
          </span>
        )}
      </div>

      {/* Error banner */}
      {error && (
        <div
          role="alert"
          style={{
            margin: 'var(--ca-space-2)',
            padding: 'var(--ca-space-2)',
            backgroundColor: 'var(--ca-status-red-bg)',
            color: 'var(--ca-status-red)',
            borderRadius: 'var(--ca-radius-sm)',
            fontSize: 'var(--ca-font-size-sm)',
          }}
        >
          &#9888; Error loading data: {error}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div
          aria-live="polite"
          aria-busy="true"
          style={{
            padding: 'var(--ca-space-6)',
            textAlign: 'center',
            color: 'var(--ca-text-secondary)',
            fontSize: 'var(--ca-font-size-sm)',
          }}
        >
          Loading…
        </div>
      )}

      {/* Content area */}
      {!loading && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Tab bar */}
          <div style={{
            display: 'flex',
            gap: 2,
            padding: '8px 12px 0',
            borderBottom: '1px solid var(--ca-border-default)',
            backgroundColor: 'var(--ca-surface-page)',
          }}>
            {(['chart', 'table'] as ViewTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                aria-pressed={activeTab === tab}
                style={{
                  padding: '5px 14px',
                  fontSize: 'var(--ca-font-size-sm)',
                  fontWeight: activeTab === tab ? 600 : 400,
                  cursor: 'pointer',
                  border: 'none',
                  borderBottom: activeTab === tab
                    ? '2px solid var(--ca-status-blue, #0276C0)'
                    : '2px solid transparent',
                  backgroundColor: 'transparent',
                  color: activeTab === tab
                    ? 'var(--ca-status-blue, #0276C0)'
                    : 'var(--ca-text-secondary)',
                  borderRadius: 'var(--ca-radius-sm) var(--ca-radius-sm) 0 0',
                  transition: 'color var(--ca-transition-base)',
                }}
              >
                {tab === 'chart' ? 'Box Plot' : 'Per Artifact'}
              </button>
            ))}

            {/* Summary count */}
            <span style={{
              marginLeft: 'auto',
              alignSelf: 'center',
              fontSize: 'var(--ca-font-size-xs)',
              color: 'var(--ca-text-secondary)',
            }}>
              {artifacts.length} artifact{artifacts.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Tab content */}
          <div style={{
            flex: 1,
            overflow: 'auto',
            padding: activeTab === 'chart' ? '0 var(--ca-space-3)' : 0,
          }}>
            {activeTab === 'chart' ? (
              <StateBarChart stats={stateStats} />
            ) : (
              <ArtifactTable
                artifacts={artifacts}
                stateColumns={stateColumns}
                rallyBaseUrl={rallyContext.Url?.origin}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Shared input styles ────────────────────────────────────────────────

const selectStyle: React.CSSProperties = {
  padding: '4px 8px',
  fontSize: 'var(--ca-font-size-sm)',
  color: 'var(--ca-text-primary)',
  backgroundColor: 'var(--ca-surface-raised)',
  border: '1px solid var(--ca-border-default)',
  borderRadius: 'var(--ca-radius-xs)',
  width: '100%',
  boxSizing: 'border-box',
};

const inputStyle = selectStyle;
