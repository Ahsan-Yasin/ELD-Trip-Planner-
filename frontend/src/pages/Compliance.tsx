import React, { useState } from 'react';
import { useTripStore } from '../store';
import {
  AlertTriangle,
  Clock,
  Calendar,
  Gavel,
  Download,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  FileCheck,
  Shield,
} from 'lucide-react';

// ── Mock fallback data ────────────────────────────────────────────────────────
const MOCK_GAUGES = {
  driveHoursUsed: 11.0,
  cycleHoursRem: 31.5,
  daysRequired: 2,
  violations: [
    {
      title: '14-Hour Window Violation',
      code: 'FMCSA §395.3(a)(2)',
      desc: 'Driving is not permitted after the 14th hour following 10 consecutive hours off duty.',
    },
  ],
  events: [
    { time: '12:00 AM', status: 'OFF Duty', loc: 'Chicago, IL', note: 'Rest break', statusClass: 'bg-zinc-100 text-zinc-700' },
    { time: '06:00 AM', status: 'Driving', loc: 'Chicago, IL', note: 'Pre-trip complete, depart', statusClass: 'bg-blue-100 text-blue-700 font-semibold' },
    { time: '05:00 PM', status: 'Violation', loc: 'Omaha, NE', note: 'Exceeded 14-hour window', statusClass: 'bg-red-100 text-red-700 font-bold' },
    { time: '05:00 PM', status: 'ON Duty', loc: 'Omaha, NE', note: 'Post-trip inspection, refueling', statusClass: 'bg-zinc-200 text-zinc-800' },
  ],
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const getStatusClass = (status: string): string => {
  switch (status) {
    case 'driving': return 'bg-blue-100 text-blue-700 font-semibold';
    case 'on_duty_not_driving': return 'bg-zinc-200 text-zinc-800';
    case 'sleeper_berth': return 'bg-indigo-100 text-indigo-700';
    default: return 'bg-zinc-100 text-zinc-700';
  }
};

const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'driving': return 'Driving';
    case 'on_duty_not_driving': return 'ON Duty';
    case 'sleeper_berth': return 'Sleeper';
    default: return 'OFF Duty';
  }
};

// ── Main Component ────────────────────────────────────────────────────────────
const Compliance: React.FC = () => {
  const { complianceData, eldLogs } = useTripStore();
  const [activeDayIdx, setActiveDayIdx] = useState(0);

  const hasTripData = !!(complianceData && eldLogs && eldLogs.length > 0);

  // Resolved values
  const driveHoursUsed = hasTripData ? complianceData.drive_hours_used : MOCK_GAUGES.driveHoursUsed;
  const cycleHoursRemaining = hasTripData ? complianceData.remaining_cycle_hours : MOCK_GAUGES.cycleHoursRem;
  const daysRequired = hasTripData ? complianceData.days_required : MOCK_GAUGES.daysRequired;
  const totalDays = hasTripData ? eldLogs.length : 2;
  const isCompliant = hasTripData ? complianceData.is_compliant : false;

  const activeViolations = hasTripData
    ? (complianceData.violations || []).map((v: string) => ({
        title: v,
        code: 'FMCSA HOS Rule',
        desc: 'Driver exceeded permitted safety parameters for the current duty cycle.',
      }))
    : MOCK_GAUGES.violations;

  // Event log for active day
  const activeEventLog = hasTripData && complianceData.daily_segments?.[activeDayIdx]
    ? complianceData.daily_segments[activeDayIdx].activities.map((act: any) => ({
        time: act.start_str,
        status: getStatusLabel(act.status),
        loc: ['Driving', 'Driving to Fuel Stop'].includes(act.label) ? 'En Route' : act.label,
        note: `${act.label} — ${act.duration.toFixed(1)} hrs`,
        statusClass: getStatusClass(act.status),
      }))
    : MOCK_GAUGES.events;

  // ELD log for active day
  const activeEldLog = hasTripData ? eldLogs[Math.min(activeDayIdx, eldLogs.length - 1)] : null;

  const downloadActiveLog = () => {
    if (activeEldLog) {
      const link = document.createElement('a');
      const src = activeEldLog.image_b64.startsWith('data:')
        ? activeEldLog.image_b64
        : `data:image/png;base64,${activeEldLog.image_b64}`;
      link.href = src;
      link.download = `eld_log_day_${activeEldLog.day}.png`;
      link.click();
    } else {
      alert('Plan a trip first to generate downloadable ELD log sheets.');
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-background p-md md:p-lg space-y-lg max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-md pb-md border-b border-border-subtle">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface flex items-center gap-sm">
            <Shield className="text-primary" size={28} />
            Compliance & ELD Logs
          </h1>
          <p className="font-body-md text-body-md text-text-secondary mt-xs">
            Driver: John Doe (ID: 84729) • 70hr/8-day Property-Carrying Cycle
            {!hasTripData && ' • Showing example data — plan a trip to see real logs'}
          </p>
        </div>
        <button
          onClick={downloadActiveLog}
          className="h-[44px] px-md border border-primary text-primary bg-transparent rounded-lg font-label-md text-label-md flex items-center gap-sm hover:bg-surface-container-high transition-colors"
        >
          <Download size={18} />
          Download PNG
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-lg items-start w-full">
        {/* ── Left: Stats Column ── */}
        <div className="w-full lg:w-[300px] flex flex-col gap-md shrink-0">
          {/* Overall Status */}
          <div className={`rounded-xl p-md border flex items-center gap-md ${
            isCompliant
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-error-container/15 border-error-container text-on-error-container'
          }`}>
            {isCompliant
              ? <CheckCircle size={22} className="text-emerald-600 shrink-0" />
              : <AlertTriangle size={22} className="text-error shrink-0" />
            }
            <div>
              <div className="font-label-md text-xs font-bold uppercase tracking-wider">
                {isCompliant ? 'Route Compliant' : 'Violations Detected'}
              </div>
              <div className="text-xs opacity-80 mt-xs">
                {isCompliant ? 'All HOS rules satisfied.' : `${activeViolations.length} active violation(s).`}
              </div>
            </div>
          </div>

          {/* Drive Hours Gauge */}
          <div className="bg-surface-container-lowest border border-border-subtle rounded-xl p-md">
            <div className="flex justify-between items-start mb-sm">
              <span className="font-label-md text-[11px] text-text-secondary uppercase tracking-wider font-semibold">
                Drive Hours Used
              </span>
              {driveHoursUsed >= 11
                ? <AlertTriangle className="text-error" size={18} />
                : <CheckCircle className="text-emerald-500" size={18} />
              }
            </div>
            <div className="flex items-end gap-xs mb-xs">
              <span className="font-headline-md text-headline-md text-on-surface">
                {driveHoursUsed.toFixed(1)}<span className="text-text-secondary font-body-md text-sm">h</span>
              </span>
              <span className="font-body-md text-xs text-text-secondary mb-[2px]">/ 11.0h</span>
            </div>
            <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${driveHoursUsed >= 11 ? 'bg-error' : 'bg-primary-container'}`}
                style={{ width: `${Math.min(100, (driveHoursUsed / 11) * 100)}%` }}
              />
            </div>
            <p className={`font-label-md text-[11px] mt-sm ${driveHoursUsed >= 11 ? 'text-error font-semibold' : 'text-text-secondary'}`}>
              {driveHoursUsed >= 11 ? 'Daily limit reached.' : `${(11 - driveHoursUsed).toFixed(1)}h remaining today.`}
            </p>
          </div>

          {/* Cycle Hours Gauge */}
          <div className="bg-surface-container-lowest border border-border-subtle rounded-xl p-md">
            <div className="flex justify-between items-start mb-sm">
              <span className="font-label-md text-[11px] text-text-secondary uppercase tracking-wider font-semibold">
                Cycle Hours Rem.
              </span>
              <Clock className="text-primary" size={18} />
            </div>
            <div className="flex items-end gap-xs mb-xs">
              <span className="font-headline-md text-headline-md text-on-surface">
                {cycleHoursRemaining.toFixed(1)}<span className="text-text-secondary font-body-md text-sm">h</span>
              </span>
              <span className="font-body-md text-xs text-text-secondary mb-[2px]">/ 70.0h</span>
            </div>
            <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 bg-primary-container"
                style={{ width: `${Math.min(100, (cycleHoursRemaining / 70) * 100)}%` }}
              />
            </div>
            <p className="font-label-md text-[11px] text-text-secondary mt-sm">
              {cycleHoursRemaining <= 10 ? '⚠ Approaching cycle limit.' : '8-day rolling window.'}
            </p>
          </div>

          {/* Days Required */}
          <div className="bg-surface-container-lowest border border-border-subtle rounded-xl p-md">
            <div className="flex justify-between items-start mb-sm">
              <span className="font-label-md text-[11px] text-text-secondary uppercase tracking-wider font-semibold">
                Days Required
              </span>
              <Calendar className="text-primary" size={18} />
            </div>
            <div className="flex items-end gap-xs mb-xs">
              <span className="font-headline-md text-headline-md text-on-surface">{daysRequired}</span>
              <span className="font-body-md text-xs text-text-secondary mb-[2px]">days of duty</span>
            </div>
            <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${Math.min(100, (daysRequired / 8) * 100)}%` }}
              />
            </div>
          </div>

          {/* Violations */}
          {activeViolations.length > 0 && (
            <div className="bg-surface-container-lowest border border-error-container/60 rounded-xl p-md">
              <h3 className="font-label-md text-[11px] text-error font-semibold uppercase tracking-wider mb-sm">
                Active Violations
              </h3>
              <div className="space-y-sm">
                {activeViolations.map((v: any, idx: number) => (
                  <div key={idx} className="bg-error-container/15 border border-error-container/30 rounded-lg p-sm flex items-start gap-sm">
                    <Gavel className="text-error shrink-0 mt-[2px]" size={15} />
                    <div>
                      <p className="font-label-md text-xs text-on-error-container font-semibold">{v.title}</p>
                      <p className="font-mono text-[10px] text-error/70 mt-[2px]">{v.code}</p>
                      <p className="font-body-md text-[11px] text-on-error-container/85 mt-xs leading-relaxed">{v.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Right: ELD Log Viewer ── */}
        <div className="flex-1 w-full bg-surface-container-lowest border border-border-subtle rounded-xl flex flex-col min-h-[600px] overflow-hidden">
          {/* Viewer Header */}
          <div className="border-b border-border-subtle p-md bg-surface-container-low flex justify-between items-center">
            <div className="flex items-center gap-sm">
              <button
                onClick={() => setActiveDayIdx((p) => Math.max(0, p - 1))}
                disabled={activeDayIdx === 0}
                className="p-xs text-text-secondary hover:text-primary disabled:opacity-30 transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <h3 className="font-headline-sm text-sm md:text-base text-on-surface font-semibold">
                ELD Log: Day {activeDayIdx + 1} of {totalDays}
              </h3>
              <button
                onClick={() => setActiveDayIdx((p) => Math.min(totalDays - 1, p + 1))}
                disabled={activeDayIdx >= totalDays - 1}
                className="p-xs text-text-secondary hover:text-primary disabled:opacity-30 transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>
            <div className="flex gap-sm">
              {!isCompliant ? (
                <span className="bg-error-container text-on-error-container font-label-md text-[10px] font-bold px-sm py-[4px] rounded-md flex items-center gap-xs">
                  <AlertTriangle size={12} />
                  Violation
                </span>
              ) : (
                <span className="bg-emerald-50 text-emerald-700 font-label-md text-[10px] font-bold px-sm py-[4px] rounded-md flex items-center gap-xs">
                  <CheckCircle size={12} />
                  Compliant
                </span>
              )}
              <span className="bg-surface-container-highest text-secondary border border-border-subtle font-label-md text-[10px] font-semibold px-sm py-[4px] rounded-md flex items-center gap-xs">
                <FileCheck size={12} />
                Certified
              </span>
            </div>
          </div>

          {/* ELD Image or Mock Grid */}
          <div className="p-md flex-1 overflow-auto bg-surface flex flex-col items-center">
            {hasTripData && activeEldLog ? (
              <div className="w-full flex flex-col items-center py-md">
                <img
                  src={activeEldLog.image_b64.startsWith('data:')
                    ? activeEldLog.image_b64
                    : `data:image/png;base64,${activeEldLog.image_b64}`}
                  alt={`ELD Log Day ${activeDayIdx + 1}`}
                  className="w-full max-w-[1000px] border border-border-subtle rounded-lg shadow-sm bg-white"
                  style={{ imageRendering: 'auto' }}
                />
              </div>
            ) : (
              // CSS-based mock grid
              <div className="w-full max-w-[1000px] bg-white border border-border-subtle rounded-lg p-md shadow-sm">
                <p className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider mb-md text-center">
                  Sample ELD Grid — Plan a trip to generate real logs
                </p>
                <div className="border-b border-border-subtle pb-xs mb-sm flex justify-between font-mono text-[10px] text-text-secondary opacity-65">
                  <div className="w-[80px]">STATUS</div>
                  <div className="flex-1 flex justify-between px-xs">
                    {['M','1','2','3','4','5','6','7','8','9','10','11','N','1','2','3','4','5','6','7','8','9','10','11'].map((h, i) => (
                      <span key={i}>{h}</span>
                    ))}
                  </div>
                  <div className="w-[60px] text-right">TOTAL</div>
                </div>
                <div className="relative h-[240px] border border-border-subtle bg-surface-container-lowest font-mono text-[11px] rounded overflow-hidden">
                  <div className="absolute inset-0 flex pl-[80px] pr-[60px] opacity-15 pointer-events-none">
                    {Array.from({ length: 24 }).map((_, i) => (
                      <div key={i} className="flex-1 border-r border-zinc-400 h-full" />
                    ))}
                  </div>
                  {[
                    { label: 'OFF', lineStyle: 'left-0 w-[25%]', total: '6.0' },
                    { label: 'SB', lineStyle: 'hidden', total: '0.0' },
                    { label: 'D', lineStyle: 'left-[25%] w-[45.8%] bg-zinc-950', total: '11.0', isActive: true },
                    { label: 'ON', lineStyle: 'left-[70.8%] right-0', total: '7.0' },
                  ].map((row, idx) => (
                    <div key={idx} className={`flex h-[60px] border-b border-border-subtle relative items-center ${row.isActive ? 'bg-blue-50/20' : ''}`}>
                      <div className={`w-[80px] px-sm ${row.isActive ? 'font-bold text-on-surface' : 'font-semibold text-secondary'}`}>{row.label}</div>
                      <div className="flex-1 relative h-full">
                        {row.lineStyle !== 'hidden' && (
                          <div className={`absolute top-1/2 h-[3px] bg-zinc-950 -translate-y-1/2 ${row.lineStyle}`} />
                        )}
                      </div>
                      <div className={`w-[60px] text-right pr-sm ${row.isActive ? 'text-on-surface font-semibold' : 'text-secondary'}`}>{row.total}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Event Log Table */}
            <div className="w-full max-w-[1000px] mt-lg">
              <h4 className="font-label-md text-xs font-semibold text-text-secondary uppercase tracking-wider mb-sm">
                Event Log — Day {activeDayIdx + 1}
              </h4>
              <div className="border border-border-subtle rounded-lg overflow-hidden bg-surface-container-lowest">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-surface-container-low border-b border-border-subtle font-label-md text-xs text-text-secondary">
                    <tr>
                      <th className="py-sm px-md font-semibold">Time</th>
                      <th className="py-sm px-md font-semibold">Status</th>
                      <th className="py-sm px-md font-semibold">Location</th>
                      <th className="py-sm px-md font-semibold">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="font-body-md text-xs divide-y divide-border-subtle text-text-primary">
                    {activeEventLog.map((event: any, idx: number) => (
                      <tr key={idx} className="hover:bg-surface-container-low/20 transition-colors">
                        <td className="py-sm px-md font-mono">{event.time}</td>
                        <td className="py-sm px-md">
                          <span className={`px-xs py-[2px] rounded text-[10px] uppercase tracking-wide ${event.statusClass}`}>
                            {event.status}
                          </span>
                        </td>
                        <td className="py-sm px-md text-text-secondary">{event.loc}</td>
                        <td className="py-sm px-md text-text-secondary">{event.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Compliance;
