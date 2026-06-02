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
  FileCheck
} from 'lucide-react';

const Compliance: React.FC = () => {
  const { complianceData, eldLogs } = useTripStore();
  const [activeDayIdx, setActiveDayIdx] = useState(0);

  // Fallback / default mockup stats if no trip calculated
  const mockGauges = {
    driveHoursUsed: 11.0,
    driveHoursLimit: 11.0,
    cycleHoursRem: 31.5,
    cycleHoursLimit: 70.0,
    daysRequired: 2,
    violations: [
      {
        title: '14-Hour Window Violation',
        code: 'FMCSA §395.3(a)(2)',
        desc: 'Driving is not permitted after the 14th hour after coming on duty following 10 consecutive hours off duty.'
      }
    ],
    events: [
      { time: '12:00 AM', status: 'OFF Duty', loc: 'Chicago, IL', note: 'Rest break', statusClass: 'bg-zinc-100 text-zinc-700' },
      { time: '06:00 AM', status: 'Driving', loc: 'Chicago, IL', note: 'Pre-trip complete, depart', statusClass: 'bg-blue-100 text-blue-700 font-semibold' },
      { time: '05:00 PM', status: 'Violation', loc: 'Omaha, NE', note: 'Exceeded 14-hour window limit', statusClass: 'bg-red-100 text-red-700 font-bold' },
      { time: '05:00 PM', status: 'ON Duty', loc: 'Omaha, NE', note: 'Post-trip inspection, refueling', statusClass: 'bg-zinc-200 text-zinc-800' }
    ]
  };

  // Determine if we should use actual calculated store data or mock data
  const hasTripCalculated = complianceData && eldLogs && eldLogs.length > 0;
  
  // Computed values
  const driveHoursUsed = hasTripCalculated 
    ? complianceData.drive_hours_used
    : mockGauges.driveHoursUsed;

  const cycleHoursRemaining = hasTripCalculated
    ? complianceData.remaining_cycle_hours
    : mockGauges.cycleHoursRem;

  const daysRequired = hasTripCalculated
    ? complianceData.days_required
    : mockGauges.daysRequired;

  const activeViolations = hasTripCalculated
    ? complianceData.violations.map((v: string) => ({
        title: v,
        code: 'FMCSA HOS Rule',
        desc: 'Driver exceeded safety parameters for the property-carrying 70-hour / 8-day cycle limit.'
      }))
    : mockGauges.violations;

  const totalDays = hasTripCalculated ? eldLogs.length : 2;

  // Handle slide/day switching
  const handlePrevDay = () => {
    setActiveDayIdx(prev => (prev > 0 ? prev - 1 : prev));
  };

  const handleNextDay = () => {
    setActiveDayIdx(prev => (prev < totalDays - 1 ? prev + 1 : prev));
  };

  // Generate dynamic event log based on active day activities
  const getEventLogForActiveDay = () => {
    if (hasTripCalculated && complianceData.daily_segments && complianceData.daily_segments[activeDayIdx]) {
      const segment = complianceData.daily_segments[activeDayIdx];
      return segment.activities.map((act: any) => {
        let statusDisplay = 'OFF Duty';
        let statusClass = 'bg-zinc-100 text-zinc-700';

        if (act.status === 'driving') {
          statusDisplay = 'Driving';
          statusClass = 'bg-blue-100 text-blue-700 font-semibold';
        } else if (act.status === 'on_duty_not_driving') {
          statusDisplay = 'ON Duty';
          statusClass = 'bg-zinc-200 text-zinc-800';
        } else if (act.status === 'sleeper_berth') {
          statusDisplay = 'Sleeper';
          statusClass = 'bg-indigo-100 text-indigo-700';
        }

        return {
          time: act.start_str,
          status: statusDisplay,
          loc: act.label === 'Driving' || act.label === 'Driving to Fuel Stop' ? 'En Route' : act.label,
          note: `${act.label} for ${act.duration.toFixed(1)} hrs`,
          statusClass
        };
      });
    }

    return mockGauges.events;
  };

  const activeEventLog = getEventLogForActiveDay();

  // Downloader for ELD Image
  const downloadActiveLog = () => {
    if (hasTripCalculated) {
      const currentLog = eldLogs[activeDayIdx];
      const link = document.createElement('a');
      const b64 = currentLog.image_b64.startsWith('data:') 
        ? currentLog.image_b64 
        : `data:image/png;base64,${currentLog.image_b64}`;
      link.href = b64;
      link.download = `eld_log_day_${currentLog.day}.png`;
      link.click();
    } else {
      alert('Mock Mode: Please plan a trip in the Trip Planner to generate downloadable PNG logs.');
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-background p-md md:p-lg space-y-lg max-w-7xl mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-md pb-md border-b border-border-subtle shrink-0">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">Compliance &amp; ELD Logs</h1>
          <p className="font-body-md text-body-md text-text-secondary mt-xs">
            Driver: John Doe (ID: 84729) • Current Cycle: 70hr/8days Property-carrying
          </p>
        </div>
        <div className="flex gap-sm">
          <button 
            onClick={downloadActiveLog}
            className="h-[44px] px-md border border-primary text-primary bg-transparent rounded-lg font-label-md text-label-md flex items-center gap-sm hover:bg-surface-container-high transition-colors"
          >
            <Download size={18} />
            Download PNG
          </button>
        </div>
      </div>

      {/* Grid Content */}
      <div className="flex flex-col lg:flex-row gap-lg items-start w-full">
        
        {/* Left Column: Compliance Stats (Gauges) */}
        <div className="w-full lg:w-[320px] flex flex-col gap-md shrink-0">
          
          {/* Gauge 1: Drive Hours Used */}
          <div className="bg-surface-container-lowest border border-border-subtle rounded-xl p-md">
            <div className="flex justify-between items-start mb-sm">
              <span className="font-label-md text-[11px] text-text-secondary uppercase tracking-wider font-semibold">Drive Hours Used</span>
              {driveHoursUsed >= 11 ? (
                <AlertTriangle className="text-error" size={18} />
              ) : (
                <CheckCircle className="text-emerald-500" size={18} />
              )}
            </div>
            <div className="flex items-end gap-xs mb-xs">
              <span className="font-headline-md text-headline-md text-on-surface">{driveHoursUsed.toFixed(1)}<span className="text-text-secondary font-body-md">h</span></span>
              <span className="font-body-md text-xs text-text-secondary mb-[2px]">/ 11.0h</span>
            </div>
            <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
              <div 
                className={`h-full ${driveHoursUsed >= 11 ? 'bg-error' : 'bg-primary-container'}`} 
                style={{ width: `${Math.min(100, (driveHoursUsed / 11) * 100)}%` }}
              ></div>
            </div>
            <p className={`font-label-md text-[11px] mt-sm ${driveHoursUsed >= 11 ? 'text-error font-semibold' : 'text-text-secondary'}`}>
              {driveHoursUsed >= 11 ? 'Limit reached. Cannot drive.' : `${(11 - driveHoursUsed).toFixed(1)}h drive time remaining today.`}
            </p>
          </div>

          {/* Gauge 2: Cycle Hours Remaining */}
          <div className="bg-surface-container-lowest border border-border-subtle rounded-xl p-md">
            <div className="flex justify-between items-start mb-sm">
              <span className="font-label-md text-[11px] text-text-secondary uppercase tracking-wider font-semibold">Cycle Hours Rem.</span>
              <Clock className="text-primary" size={18} />
            </div>
            <div className="flex items-end gap-xs mb-xs">
              <span className="font-headline-md text-headline-md text-on-surface">{cycleHoursRemaining.toFixed(1)}<span className="text-text-secondary font-body-md">h</span></span>
              <span className="font-body-md text-xs text-text-secondary mb-[2px]">/ 70.0h</span>
            </div>
            <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary-container" 
                style={{ width: `${Math.min(100, (cycleHoursRemaining / 70) * 100)}%` }}
              ></div>
            </div>
            <p className="font-label-md text-[11px] text-text-secondary mt-sm">
              {cycleHoursRemaining <= 10 ? 'Approaching cycle limit warning.' : 'Standard 8-day rolling window cycle hours.'}
            </p>
          </div>

          {/* Gauge 3: Days Required */}
          <div className="bg-surface-container-lowest border border-border-subtle rounded-xl p-md">
            <div className="flex justify-between items-start mb-sm">
              <span className="font-label-md text-[11px] text-text-secondary uppercase tracking-wider font-semibold">Days Required</span>
              <Calendar className="text-primary" size={18} />
            </div>
            <div className="flex items-end gap-xs mb-xs">
              <span className="font-headline-md text-headline-md text-on-surface">{daysRequired}</span>
              <span className="font-body-md text-xs text-text-secondary mb-[2px]">Days of Duty</span>
            </div>
            <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary" 
                style={{ width: `${Math.min(100, (daysRequired / 8) * 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Violations Warning Block */}
          {activeViolations.length > 0 && (
            <div className="bg-surface-container-lowest border border-error-container rounded-xl p-md">
              <h3 className="font-label-md text-[11px] text-error font-semibold uppercase tracking-wider mb-sm">Active Violations</h3>
              <div className="space-y-sm">
                {activeViolations.map((violation: any, idx: number) => (
                  <div key={idx} className="bg-error-container/20 border border-error-container/30 rounded-lg p-sm flex items-start gap-sm">
                    <Gavel className="text-error shrink-0 mt-[2px]" size={16} />
                    <div>
                      <p className="font-label-md text-xs text-on-error-container font-semibold">{violation.title}</p>
                      <p className="font-body-md text-[11px] text-on-error-container/85 mt-xs leading-relaxed">
                        {violation.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: ELD Log Sheet Image / CSS Grid Viewer */}
        <div className="flex-1 w-full bg-surface-container-lowest border border-border-subtle rounded-xl flex flex-col min-h-[600px] overflow-hidden">
          
          {/* Viewer Header */}
          <div className="border-b border-border-subtle p-md bg-surface-container-low flex justify-between items-center">
            <div className="flex items-center gap-sm">
              <button 
                onClick={handlePrevDay} 
                disabled={activeDayIdx === 0}
                className="p-xs text-text-secondary hover:text-primary disabled:opacity-30 disabled:hover:text-text-secondary transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <h3 className="font-headline-sm text-sm md:text-base text-on-surface">
                Log: Day {activeDayIdx + 1} of {totalDays}
              </h3>
              <button 
                onClick={handleNextDay}
                disabled={activeDayIdx === totalDays - 1}
                className="p-xs text-text-secondary hover:text-primary disabled:opacity-30 disabled:hover:text-text-secondary transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>
            <div className="flex gap-sm">
              {(!hasTripCalculated || !complianceData.is_compliant) ? (
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

          {/* Log Canvas (Image or Mock CSS grid) */}
          <div className="p-md flex-1 overflow-auto bg-surface flex flex-col items-center">
            
            {hasTripCalculated ? (
              // Display generated Pillow PNG image
              <div className="w-full flex flex-col items-center py-md">
                <img 
                  src={
                    eldLogs[activeDayIdx].image_b64.startsWith('data:') 
                      ? eldLogs[activeDayIdx].image_b64 
                      : `data:image/png;base64,${eldLogs[activeDayIdx].image_b64}`
                  } 
                  alt={`ELD Log Day ${activeDayIdx + 1}`}
                  className="w-full max-w-[1000px] border border-border-subtle rounded-lg shadow-sm bg-white"
                  style={{ imageRendering: 'auto' }}
                />
              </div>
            ) : (
              // High fidelity fallback interactive CSS-based log grid if no calculated trip
              <div className="w-full max-w-[1000px] bg-white border border-border-subtle rounded-lg p-md shadow-sm space-y-md">
                <div className="border-b border-border-subtle pb-xs mb-sm flex justify-between font-mono text-[10px] text-text-secondary opacity-65">
                  <div className="w-[80px]">STATUS</div>
                  <div className="flex-1 flex justify-between px-xs">
                    <span>M</span><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span><span>7</span><span>8</span><span>9</span><span>10</span><span>11</span><span>N</span><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span><span>7</span><span>8</span><span>9</span><span>10</span><span>11</span>
                  </div>
                  <div className="w-[60px] text-right">TOTAL</div>
                </div>

                {/* CSS Rows to match mockup */}
                <div className="relative h-[240px] border border-border-subtle bg-surface-container-lowest font-mono text-[11px] rounded overflow-hidden">
                  
                  {/* Grid Lines Overlay */}
                  <div className="absolute inset-0 flex pl-[80px] pr-[60px] opacity-15 pointer-events-none">
                    {Array.from({ length: 24 }).map((_, i) => (
                      <div key={i} className="flex-1 border-r border-zinc-400 h-full"></div>
                    ))}
                  </div>

                  {/* OFF DUTY ROW */}
                  <div className="flex h-[60px] border-b border-border-subtle relative items-center">
                    <div className="w-[80px] px-sm font-semibold text-secondary">OFF</div>
                    <div className="flex-1 relative h-full">
                      {/* Line: Midnight to 6am (25% width) */}
                      <div className="absolute top-1/2 left-0 w-[25%] h-[3px] bg-zinc-950 -translate-y-1/2"></div>
                    </div>
                    <div className="w-[60px] text-right pr-sm text-secondary">6.0</div>
                  </div>

                  {/* SLEEPER BERTH ROW */}
                  <div className="flex h-[60px] border-b border-border-subtle relative items-center">
                    <div className="w-[80px] px-sm font-semibold text-secondary">SB</div>
                    <div className="flex-1 relative h-full"></div>
                    <div className="w-[60px] text-right pr-sm text-secondary">0.0</div>
                  </div>

                  {/* DRIVING ROW */}
                  <div className="flex h-[60px] border-b border-border-subtle relative items-center bg-blue-50/20">
                    <div className="w-[80px] px-sm font-bold text-on-surface">D</div>
                    <div className="flex-1 relative h-full">
                      {/* Vertical connector at 6am */}
                      <div className="absolute top-[-30px] left-[25%] w-[2px] h-[60px] bg-zinc-950"></div>
                      {/* Line segment: 6am to 5pm (45.8% width) */}
                      <div className="absolute top-1/2 left-[25%] w-[45.8%] h-[3px] bg-zinc-950 -translate-y-1/2"></div>
                      {/* Red Violation Overdrive Line segment overlay */}
                      <div className="absolute top-1/2 left-[65%] w-[5.8%] h-[3.5px] bg-error -translate-y-1/2 shadow-sm"></div>
                    </div>
                    <div className="w-[60px] text-right pr-sm text-on-surface font-semibold">11.0</div>
                  </div>

                  {/* ON DUTY ROW */}
                  <div className="flex h-[60px] relative items-center">
                    <div className="w-[80px] px-sm font-semibold text-secondary">ON</div>
                    <div className="flex-1 relative h-full">
                      {/* Vertical connector at 5pm */}
                      <div className="absolute top-[-30px] left-[70.8%] w-[2px] h-[60px] bg-zinc-950"></div>
                      {/* Line segment: 5pm to Midnight */}
                      <div className="absolute top-1/2 left-[70.8%] right-0 h-[3px] bg-zinc-950 -translate-y-1/2"></div>
                    </div>
                    <div className="w-[60px] text-right pr-sm text-secondary">7.0</div>
                  </div>

                </div>
              </div>
            )}

            {/* Event Log Table */}
            <div className="w-full max-w-[1000px] mt-lg">
              <h4 className="font-label-md text-xs font-semibold text-text-secondary uppercase tracking-wider mb-sm">Event log</h4>
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
