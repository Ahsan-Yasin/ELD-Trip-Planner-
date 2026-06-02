import React from 'react';
import { useTripStore } from '../store';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle, Download, Map } from 'lucide-react';

const TripPlanner: React.FC = () => {
  const {
    currentLocation, pickupLocation, dropoffLocation, cycleUsed, driverName,
    setCurrentLocation, setPickupLocation, setDropoffLocation, setCycleUsed, setDriverName,
    calculateTrip, isLoading, routeData, complianceData, eldLogs, error,
  } = useTripStore();

  const navigate = useNavigate();

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    calculateTrip();
  };

  const downloadEldLog = (log: any) => {
    const link = document.createElement('a');
    const src = log.image_b64.startsWith('data:') ? log.image_b64 : `data:image/png;base64,${log.image_b64}`;
    link.href = src;
    link.download = `eld_log_day_${log.day}.png`;
    link.click();
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-surface-container-lowest h-full w-full">
      {/* ── Left Column ── */}
      <div className="w-full md:w-[340px] border-r border-border-subtle flex flex-col shrink-0 h-full overflow-y-auto">
        {/* Form */}
        <div className="p-lg border-b border-border-subtle">
          <h1 className="font-headline-md text-headline-md mb-xs text-on-surface">Trip Planner</h1>
          <p className="text-xs text-text-secondary mb-lg">Plan a compliant HOS route with ELD log generation.</p>

          <form className="flex flex-col gap-md" onSubmit={handleCalculate}>
            {[
              { label: 'Current Location', value: currentLocation, set: setCurrentLocation, placeholder: 'Chicago, IL' },
              { label: 'Pickup Location', value: pickupLocation, set: setPickupLocation, placeholder: 'Detroit, MI' },
              { label: 'Dropoff Location', value: dropoffLocation, set: setDropoffLocation, placeholder: 'New York, NY' },
              { label: 'Driver Name', value: driverName, set: setDriverName, placeholder: 'John Doe' },
            ].map(({ label, value, set, placeholder }) => (
              <div key={label} className="flex flex-col">
                <label className="font-label-md text-label-md text-secondary mb-xs">{label}</label>
                <input
                  className="border-0 border-b border-border-subtle bg-transparent px-0 py-sm focus:ring-0 focus:border-primary transition-colors duration-300 font-body-md text-body-md outline-none"
                  type="text"
                  value={value}
                  placeholder={placeholder}
                  onChange={(e) => set(e.target.value)}
                />
              </div>
            ))}

            <div className="flex flex-col">
              <label className="font-label-md text-label-md text-secondary mb-xs">
                Cycle Hours Used (of 70h)
              </label>
              <input
                className="border-0 border-b border-border-subtle bg-transparent px-0 py-sm focus:ring-0 focus:border-primary transition-colors duration-300 font-body-md text-body-md outline-none"
                type="number"
                step="0.5"
                min="0"
                max="70"
                value={cycleUsed}
                onChange={(e) => setCycleUsed(parseFloat(e.target.value) || 0)}
              />
            </div>

            <button
              className="mt-sm bg-primary text-on-primary h-[44px] rounded-lg font-label-md text-label-md hover:brightness-110 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-sm"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Calculating Route...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">route</span>
                  Calculate Route
                </>
              )}
            </button>
          </form>

          {/* Error Message */}
          {error && (
            <div className="mt-md p-sm bg-error-container/20 border border-error-container rounded-lg flex items-start gap-sm">
              <AlertTriangle size={16} className="text-error shrink-0 mt-[1px]" />
              <p className="text-xs text-on-error-container">{error}</p>
            </div>
          )}
        </div>

        {/* Compliance Summary */}
        <div className="p-lg flex flex-col gap-md">
          <h3 className="font-headline-sm text-headline-sm text-on-surface">Compliance Status</h3>

          {/* Status Badge */}
          {complianceData && (
            <div className={`flex items-center gap-sm p-sm rounded-lg border ${
              complianceData.is_compliant
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-error-container bg-error-container/15 text-on-error-container'
            }`}>
              {complianceData.is_compliant
                ? <CheckCircle size={16} className="text-emerald-600" />
                : <AlertTriangle size={16} className="text-error" />
              }
              <span className="font-label-md text-xs font-bold">
                {complianceData.is_compliant ? 'Route is HOS Compliant' : 'HOS Violations Detected'}
              </span>
            </div>
          )}

          {/* Stat Cards */}
          {[
            {
              label: 'Drive Hours Used',
              value: complianceData ? `${complianceData.drive_hours_used.toFixed(1)}h` : '--',
              sub: '/ 11.0h daily limit',
              warn: complianceData && complianceData.drive_hours_used >= 11,
            },
            {
              label: 'Cycle Hours Remaining',
              value: complianceData ? `${complianceData.remaining_cycle_hours.toFixed(1)}h` : '--',
              sub: '/ 70h 8-day cycle',
              warn: complianceData && complianceData.remaining_cycle_hours < 10,
            },
            {
              label: 'Days Required',
              value: complianceData ? complianceData.days_required : '--',
              sub: 'days of duty',
              warn: false,
            },
          ].map(({ label, value, sub, warn }) => (
            <div
              key={label}
              className={`border rounded-lg p-md border-l-4 bg-surface-container-lowest ${
                warn ? 'border-l-error border-error-container/30' : 'border-l-emerald-500 border-border-subtle'
              }`}
            >
              <div className="font-headline-md text-headline-md text-on-surface">{value}</div>
              <div className="font-label-md text-label-md text-secondary">{label}</div>
              <div className="font-label-md text-[10px] text-text-secondary mt-xs">{sub}</div>
            </div>
          ))}

          {/* Violations */}
          {complianceData && complianceData.violations.length > 0 && (
            <div className="border border-error-container/40 rounded-lg p-md bg-error-container/10">
              <h4 className="font-label-md text-xs font-semibold text-error uppercase tracking-wider mb-sm">
                Violations
              </h4>
              {complianceData.violations.map((v: string, i: number) => (
                <div key={i} className="flex items-start gap-sm mb-xs">
                  <AlertTriangle size={14} className="text-error shrink-0 mt-[2px]" />
                  <span className="text-xs text-on-error-container">{v}</span>
                </div>
              ))}
            </div>
          )}

          {/* Route to Map / Compliance Buttons */}
          {routeData && (
            <div className="flex gap-sm mt-sm">
              <button
                onClick={() => navigate('/map')}
                className="flex-1 h-[40px] border border-primary text-primary bg-transparent rounded-lg font-label-md text-xs hover:bg-surface-container-high transition-colors flex items-center justify-center gap-xs"
              >
                <Map size={14} />
                View Map
              </button>
              <button
                onClick={() => navigate('/compliance')}
                className="flex-1 h-[40px] border border-border-subtle text-secondary bg-transparent rounded-lg font-label-md text-xs hover:bg-surface-container-high transition-colors flex items-center justify-center gap-xs"
              >
                <span className="material-symbols-outlined text-[14px]">gavel</span>
                View Logs
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Right Column ── */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Route Info Panel */}
        {routeData && (
          <div className="border-b border-border-subtle p-md bg-surface-container-low shrink-0">
            <div className="flex items-center gap-lg">
              <div className="flex flex-col">
                <span className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold">Total Distance</span>
                <span className="font-headline-sm text-sm font-bold text-on-surface">
                  {routeData.distance_mi.toFixed(1)} mi
                </span>
              </div>
              <div className="h-6 w-px bg-border-subtle" />
              <div className="flex flex-col">
                <span className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold">Drive Time</span>
                <span className="font-headline-sm text-sm font-bold text-on-surface">
                  {routeData.duration_hr.toFixed(2)} hrs
                </span>
              </div>
              <div className="h-6 w-px bg-border-subtle" />
              <div className="flex flex-col">
                <span className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold">Route</span>
                <span className="font-headline-sm text-sm text-on-surface">
                  {currentLocation} → {dropoffLocation}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ELD Log Viewer */}
        <div className="flex-1 p-lg flex flex-col bg-surface-container-lowest overflow-y-auto">
          <div className="flex justify-between items-center mb-md shrink-0">
            <h3 className="font-headline-sm text-headline-sm text-on-surface">
              ELD Log Sheets
              {eldLogs.length > 0 && (
                <span className="ml-sm text-xs font-normal text-text-secondary">
                  ({eldLogs.length} day{eldLogs.length !== 1 ? 's' : ''})
                </span>
              )}
            </h3>
            {eldLogs.length > 0 && (
              <button
                onClick={() => eldLogs.forEach(downloadEldLog)}
                className="h-[36px] px-md border border-primary text-primary rounded-lg font-label-md text-xs hover:bg-surface-container-low transition-colors flex items-center gap-xs"
              >
                <Download size={14} />
                Download All
              </button>
            )}
          </div>

          {eldLogs.length > 0 ? (
            <div className="flex flex-col gap-xl pb-xl">
              {eldLogs.map((log: any, idx: number) => (
                <div key={idx} className="flex flex-col border border-border-subtle rounded-xl overflow-hidden shadow-sm">
                  <div className="flex justify-between items-center px-md py-sm bg-surface-container-low border-b border-border-subtle">
                    <span className="font-label-md text-sm font-semibold text-on-surface">
                      Day {log.day} — ELD Log
                    </span>
                    <button
                      onClick={() => downloadEldLog(log)}
                      className="text-primary hover:text-primary/80 transition-colors flex items-center gap-xs text-xs"
                    >
                      <Download size={12} />
                      PNG
                    </button>
                  </div>
                  <div className="p-sm bg-white overflow-x-auto">
                    <img
                      alt={`ELD Log Day ${log.day}`}
                      className="max-w-full w-full object-contain rounded"
                      src={log.image_b64.startsWith('data:') ? log.image_b64 : `data:image/png;base64,${log.image_b64}`}
                      style={{ imageRendering: 'auto', minWidth: '600px' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center border border-border-subtle rounded-xl bg-surface-variant/10 p-xl text-center">
              <span className="material-symbols-outlined text-[48px] text-text-secondary mb-md opacity-40">
                receipt_long
              </span>
              <h4 className="font-headline-sm text-headline-sm text-text-secondary mb-sm">
                No ELD Logs Yet
              </h4>
              <p className="text-xs text-text-secondary max-w-[300px]">
                Fill in the trip details on the left and click "Calculate Route" to generate
                FMCSA-compliant ELD log sheets for each day of the trip.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TripPlanner;
