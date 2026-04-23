/**
 * Reports — owner-facing reports hub (Sprint 6 D2 + Sprint 7 D3/D5).
 *
 * Three report cards, each with a live summary and a CSV export:
 *   • Daily report — per-child activities for today. Parents already see
 *     these live in the app, but owners need a single-glance view for
 *     end-of-day audits and to email a report home if a parent asks.
 *   • Attendance — staff clock-in shifts in the last 7 days with total
 *     hours. CSV export drives payroll reconciliation.
 *   • Health log — symptoms, medication, incidents, injuries across all
 *     classrooms (last 14 days).
 *
 * Data sources:
 *   activities / attendance / healthLogs — all tenant-scoped by
 *   `daycareId == ownerUid`. All reads are one-shot `getDocs()` so the
 *   page stays fast; we refetch on tab switch rather than live-subscribe
 *   (owners don't need real-time here).
 *
 * Gating:
 *   • Attendance card requires `staffClockIn` (Pro).
 *   • Health card requires `healthReports` (Pro).
 *   • Daily report card is always available (shows activities, which
 *     are part of the core Starter offering).
 */
import React from 'react';
import {
  Activity,
  Calendar,
  Clock,
  Download,
  FileText,
  Loader2,
  RefreshCw,
  Stethoscope,
  Users,
} from 'lucide-react';
import {
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore';

import { Layout } from '../components/layout';
import { Card, CardBody, CardHeader, Button, Badge, EmptyState } from '../components/ui';
import { UpgradeCTA } from '../components/UpgradeCTA';
import { useAuth } from '../contexts';
import { useFeature } from '../hooks';
import { db } from '../firebase/config';

// ─── Helpers ───────────────────────────────────────────────────────

function todayIso() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
}

function daysAgoIso(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();
}

function csvEscape(v) {
  if (v === null || v === undefined) return '';
  const s = String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function downloadCsv(filename, rows) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const body = rows.map((r) => headers.map((h) => csvEscape(r[h])).join(','));
  const csv = [headers.join(','), ...body].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function hoursBetween(aIso, bIso) {
  if (!aIso || !bIso) return 0;
  return (new Date(bIso).getTime() - new Date(aIso).getTime()) / (1000 * 60 * 60);
}

// ─── Page ───────────────────────────────────────────────────────────

export default function Reports() {
  const { user } = useAuth();
  const daycareId = user?.uid;

  if (!daycareId) {
    return (
      <Layout title="Reports" subtitle="Attendance, daily, health">
        <EmptyState
          icon={FileText}
          title="Not signed in"
          description="Sign in as the daycare owner to view reports."
        />
      </Layout>
    );
  }

  return (
    <Layout title="Reports" subtitle="Daily · attendance · health">
      <div className="space-y-6 max-w-5xl mx-auto">
        <DailyReportCard daycareId={daycareId} />
        <AttendanceReportCard daycareId={daycareId} />
        <HealthReportCard daycareId={daycareId} />
      </div>
    </Layout>
  );
}

// ─── Daily report (D2) ─────────────────────────────────────────────

function DailyReportCard({ daycareId }) {
  const [children, setChildren] = React.useState([]);
  const [activities, setActivities] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [childSnap, actSnap] = await Promise.all([
        getDocs(query(collection(db, 'children'), where('daycareId', '==', daycareId))),
        getDocs(
          query(
            collection(db, 'activities'),
            where('daycareId', '==', daycareId),
            where('timestamp', '>=', todayIso()),
          ),
        ),
      ]);
      setChildren(childSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setActivities(actSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error('[Reports / daily] load failed:', err);
      setError(err?.message ?? 'Failed to load daily report.');
    } finally {
      setLoading(false);
    }
  }, [daycareId]);

  React.useEffect(() => {
    load();
  }, [load]);

  const perChild = React.useMemo(() => {
    const byId = new Map();
    for (const c of children) byId.set(c.id, { child: c, items: [] });
    for (const a of activities) {
      const bucket = byId.get(a.childId);
      if (bucket) bucket.items.push(a);
    }
    return Array.from(byId.values()).sort(
      (a, b) => b.items.length - a.items.length,
    );
  }, [children, activities]);

  const handleExport = () => {
    const rows = [];
    for (const { child, items } of perChild) {
      if (items.length === 0) {
        rows.push({
          date: todayIso().slice(0, 10),
          child: `${child.firstName ?? ''} ${child.lastName ?? ''}`.trim(),
          classroom: child.classroom ?? '',
          type: '',
          detail: '— no entries today —',
          timestamp: '',
        });
      }
      for (const a of items) {
        rows.push({
          date: todayIso().slice(0, 10),
          child: `${child.firstName ?? ''} ${child.lastName ?? ''}`.trim(),
          classroom: child.classroom ?? '',
          type: a.type ?? '',
          detail: a.description ?? a.note ?? a.title ?? '',
          timestamp: a.timestamp ?? '',
        });
      }
    }
    downloadCsv(`daily-report-${todayIso().slice(0, 10)}.csv`, rows);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
              <Activity className="w-5 h-5 text-brand-600" />
            </div>
            <div>
              <h3 className="font-semibold text-surface-900">Daily report</h3>
              <p className="text-sm text-surface-500">
                Every entry logged today, grouped by child.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={load} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            </Button>
            <Button size="sm" onClick={handleExport} disabled={loading || !perChild.length}>
              <Download className="w-4 h-4" /> CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardBody>
        {error ? (
          <p className="text-sm text-danger-600">{error}</p>
        ) : loading ? (
          <div className="py-6 flex items-center gap-2 text-surface-500 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading today's entries…
          </div>
        ) : perChild.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No children enrolled"
            description="Once you add children, their daily entries will roll up here."
          />
        ) : (
          <div className="divide-y divide-surface-100">
            {perChild.map(({ child, items }) => (
              <div key={child.id} className="py-3 flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-surface-900">
                    {child.firstName} {child.lastName}
                  </p>
                  <p className="text-xs text-surface-500">
                    {child.classroom ?? 'Unassigned'}
                  </p>
                </div>
                <Badge variant={items.length > 0 ? 'success' : 'neutral'}>
                  {items.length} {items.length === 1 ? 'entry' : 'entries'}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}

// ─── Attendance report (D3) ────────────────────────────────────────

function AttendanceReportCard({ daycareId }) {
  const feature = useFeature('staffClockIn');
  const [shifts, setShifts] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  const load = React.useCallback(async () => {
    if (!feature.enabled) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const snap = await getDocs(
        query(
          collection(db, 'attendance'),
          where('daycareId', '==', daycareId),
          where('clockInAt', '>=', daysAgoIso(7)),
        ),
      );
      setShifts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error('[Reports / attendance] load failed:', err);
      setError(err?.message ?? 'Failed to load attendance.');
    } finally {
      setLoading(false);
    }
  }, [daycareId, feature.enabled]);

  React.useEffect(() => {
    load();
  }, [load]);

  const totalHours = React.useMemo(
    () =>
      shifts.reduce(
        (sum, s) => sum + hoursBetween(s.clockInAt, s.clockOutAt ?? new Date().toISOString()),
        0,
      ),
    [shifts],
  );

  const handleExport = () => {
    const rows = shifts.map((s) => ({
      userName: s.userName ?? s.userId ?? '',
      date: (s.clockInAt ?? '').slice(0, 10),
      clockIn: s.clockInAt ?? '',
      clockOut: s.clockOutAt ?? '— still clocked in —',
      hours: hoursBetween(s.clockInAt, s.clockOutAt ?? new Date().toISOString()).toFixed(2),
      classroomId: s.classroomId ?? '',
    }));
    downloadCsv(`attendance-${daysAgoIso(7).slice(0, 10)}-to-${todayIso().slice(0, 10)}.csv`, rows);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
              <Clock className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <h3 className="font-semibold text-surface-900">Staff attendance</h3>
              <p className="text-sm text-surface-500">
                Last 7 days of clock-in shifts.
              </p>
            </div>
          </div>
          {feature.enabled && (
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={load} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              </Button>
              <Button size="sm" onClick={handleExport} disabled={loading || !shifts.length}>
                <Download className="w-4 h-4" /> CSV
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardBody>
        {!feature.enabled ? (
          <UpgradeCTA feature="staffClockIn" upgradeTo={feature.upgradeTo} variant="card" />
        ) : error ? (
          <p className="text-sm text-danger-600">{error}</p>
        ) : loading ? (
          <div className="py-6 flex items-center gap-2 text-surface-500 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading shifts…
          </div>
        ) : shifts.length === 0 ? (
          <EmptyState
            icon={Clock}
            title="No shifts yet"
            description="Once your teachers start clocking in from the teacher app, shifts will appear here."
          />
        ) : (
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-surface-100 mb-2">
              <span className="text-sm text-surface-500">Total hours (7d)</span>
              <span className="text-lg font-semibold text-surface-900">
                {totalHours.toFixed(1)}
              </span>
            </div>
            <div className="space-y-2 max-h-[320px] overflow-y-auto">
              {shifts
                .sort((a, b) => (a.clockInAt < b.clockInAt ? 1 : -1))
                .map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between text-sm py-2 border-b border-surface-50 last:border-0">
                    <div>
                      <p className="font-medium text-surface-900">{s.userName ?? 'Staff'}</p>
                      <p className="text-xs text-surface-500">
                        {new Date(s.clockInAt).toLocaleString()}
                      </p>
                    </div>
                    <Badge variant={s.clockOutAt ? 'neutral' : 'success'}>
                      {s.clockOutAt
                        ? `${hoursBetween(s.clockInAt, s.clockOutAt).toFixed(1)}h`
                        : 'open'}
                    </Badge>
                  </div>
                ))}
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

// ─── Health report (D5) ────────────────────────────────────────────

function HealthReportCard({ daycareId }) {
  const feature = useFeature('healthReports');
  const [logs, setLogs] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  const load = React.useCallback(async () => {
    if (!feature.enabled) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const snap = await getDocs(
        query(
          collection(db, 'healthLogs'),
          where('daycareId', '==', daycareId),
          where('timestamp', '>=', daysAgoIso(14)),
        ),
      );
      setLogs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error('[Reports / health] load failed:', err);
      setError(err?.message ?? 'Failed to load health logs.');
    } finally {
      setLoading(false);
    }
  }, [daycareId, feature.enabled]);

  React.useEffect(() => {
    load();
  }, [load]);

  const byType = React.useMemo(() => {
    const m = new Map();
    for (const l of logs) {
      const t = l.type ?? 'other';
      m.set(t, (m.get(t) ?? 0) + 1);
    }
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
  }, [logs]);

  const handleExport = () => {
    const rows = logs
      .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1))
      .map((l) => ({
        date: (l.timestamp ?? '').slice(0, 10),
        time: (l.timestamp ?? '').slice(11, 16),
        childId: l.childId ?? '',
        type: l.type ?? '',
        severity: l.severity ?? '',
        notes: l.notes ?? '',
        loggedBy: l.staffName ?? l.staffId ?? '',
      }));
    downloadCsv(`health-log-${daysAgoIso(14).slice(0, 10)}-to-${todayIso().slice(0, 10)}.csv`, rows);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-danger-50 flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-danger-600" />
            </div>
            <div>
              <h3 className="font-semibold text-surface-900">Health log</h3>
              <p className="text-sm text-surface-500">
                Last 14 days of symptoms, medication, incidents.
              </p>
            </div>
          </div>
          {feature.enabled && (
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={load} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              </Button>
              <Button size="sm" onClick={handleExport} disabled={loading || !logs.length}>
                <Download className="w-4 h-4" /> CSV
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardBody>
        {!feature.enabled ? (
          <UpgradeCTA feature="healthReports" upgradeTo={feature.upgradeTo} variant="card" />
        ) : error ? (
          <p className="text-sm text-danger-600">{error}</p>
        ) : loading ? (
          <div className="py-6 flex items-center gap-2 text-surface-500 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading health logs…
          </div>
        ) : logs.length === 0 ? (
          <EmptyState
            icon={Stethoscope}
            title="No health entries (14d)"
            description="Teachers can log symptoms, medication, incidents, and injuries from the teacher app."
          />
        ) : (
          <div>
            <div className="grid grid-cols-4 gap-3 mb-4">
              {byType.slice(0, 4).map(([type, count]) => (
                <div
                  key={type}
                  className="rounded-xl bg-surface-50 px-3 py-2.5 border border-surface-100">
                  <p className="text-[11px] uppercase tracking-wider text-surface-500">
                    {type}
                  </p>
                  <p className="text-lg font-semibold text-surface-900">{count}</p>
                </div>
              ))}
            </div>
            <div className="space-y-2 max-h-[320px] overflow-y-auto">
              {logs
                .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1))
                .slice(0, 20)
                .map((l) => (
                  <div
                    key={l.id}
                    className="flex items-start justify-between gap-3 py-2 border-b border-surface-50 last:border-0">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="neutral">{l.type ?? 'log'}</Badge>
                        {l.severity ? <Badge variant="warning">{l.severity}</Badge> : null}
                      </div>
                      <p className="text-sm text-surface-800 mt-1.5 truncate">
                        {l.notes || '—'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-surface-500 flex items-center gap-1 justify-end">
                        <Calendar className="w-3 h-3" />
                        {(l.timestamp ?? '').slice(0, 10)}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
