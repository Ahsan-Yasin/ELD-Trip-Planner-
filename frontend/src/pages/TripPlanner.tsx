import React from 'react';
import { useTripStore } from '../store';

const TripPlanner: React.FC = () => {
  const { 
    currentLocation, pickupLocation, dropoffLocation, cycleUsed,
    setCurrentLocation, setPickupLocation, setDropoffLocation, setCycleUsed,
    calculateTrip, isLoading, routeData, complianceData, eldLogs
  } = useTripStore();

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    calculateTrip();
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-surface-container-lowest h-full w-full">
      {/* Left Column (Form & Compliance) */}
      <div className="w-full md:w-[320px] border-r border-border-subtle flex flex-col shrink-0 h-full overflow-y-auto">
        {/* Trip Planner Form */}
        <div className="p-lg border-b border-border-subtle">
          <h1 className="font-headline-md text-headline-md mb-lg">Trip Planner</h1>
          <form className="flex flex-col gap-md" onSubmit={handleCalculate}>
            <div className="flex flex-col animate-fade-in-up delay-100">
              <label className="font-label-md text-label-md text-secondary mb-xs transition-colors duration-300">Current Location</label>
              <input className="border-0 border-b border-border-subtle bg-transparent px-0 py-sm focus:ring-0 focus:border-primary transition-colors duration-300 font-body-md text-body-md" type="text" value={currentLocation} onChange={e => setCurrentLocation(e.target.value)} />
            </div>
            <div className="flex flex-col animate-fade-in-up delay-200">
              <label className="font-label-md text-label-md text-secondary mb-xs transition-colors duration-300">Pickup</label>
              <input className="border-0 border-b border-border-subtle bg-transparent px-0 py-sm focus:ring-0 focus:border-primary transition-colors duration-300 font-body-md text-body-md" type="text" value={pickupLocation} onChange={e => setPickupLocation(e.target.value)} />
            </div>
            <div className="flex flex-col animate-fade-in-up delay-300">
              <label className="font-label-md text-label-md text-secondary mb-xs transition-colors duration-300">Dropoff</label>
              <input className="border-0 border-b border-border-subtle bg-transparent px-0 py-sm focus:ring-0 focus:border-primary transition-colors duration-300 font-body-md text-body-md" type="text" value={dropoffLocation} onChange={e => setDropoffLocation(e.target.value)} />
            </div>
            <div className="flex flex-col animate-fade-in-up delay-400">
              <label className="font-label-md text-label-md text-secondary mb-xs transition-colors duration-300">Cycle Hours Used</label>
              <input className="border-0 border-b border-border-subtle bg-transparent px-0 py-sm focus:ring-0 focus:border-primary transition-colors duration-300 font-body-md text-body-md" type="number" step="0.1" value={cycleUsed} onChange={e => setCycleUsed(parseFloat(e.target.value))} />
            </div>
            <button className="mt-sm bg-primary-container text-on-primary-container h-[44px] rounded-lg font-label-md text-label-md hover:bg-opacity-90 hover:brightness-110 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-sm animate-fade-in-up delay-500" type="submit" disabled={isLoading}>
              {isLoading ? 'Calculating...' : 'Calculate Route'}
            </button>
          </form>
        </div>

        {/* Compliance Section */}
        <div className="p-lg">
          <h3 className="font-headline-sm text-headline-sm mb-md">Compliance Status</h3>
          <div className="flex flex-col gap-sm">
            <div className={`border border-border-subtle rounded-lg p-md border-l-2 ${complianceData && !complianceData.is_compliant ? 'border-l-[#EF4444]' : 'border-l-[#10B981]'} bg-surface-container-lowest animate-fade-in-up delay-400`}>
              <div className="font-headline-md text-headline-md">{complianceData ? complianceData.drive_hours_used.toFixed(1) : '--'}h</div>
              <div className="font-label-md text-label-md text-secondary">Drive Hours Used</div>
            </div>
            <div className={`border border-border-subtle rounded-lg p-md border-l-2 ${complianceData && !complianceData.is_compliant ? 'border-l-[#EF4444]' : 'border-l-[#10B981]'} bg-surface-container-lowest animate-fade-in-up delay-500`}>
              <div className="font-headline-md text-headline-md">{complianceData ? complianceData.remaining_cycle_hours.toFixed(1) : '--'}h</div>
              <div className="font-label-md text-label-md text-secondary">Cycle Hours Remaining</div>
            </div>
            <div className="border border-border-subtle rounded-lg p-md border-l-2 border-l-[#10B981] bg-surface-container-lowest animate-fade-in-up delay-600">
              <div className="font-headline-md text-headline-md">{complianceData ? complianceData.days_required : '--'}</div>
              <div className="font-label-md text-label-md text-secondary">Days Required</div>
            </div>
          </div>
          
          {complianceData && (
            <div className="mt-lg pt-md border-t border-border-subtle animate-fade-in-up delay-700">
              <h4 className="font-label-md text-label-md text-secondary mb-sm">Violations</h4>
              {complianceData.is_compliant ? (
                <div className="flex items-center gap-sm text-[#10B981]">
                  <span className="material-symbols-outlined text-[20px] animate-pulse-soft">check_circle</span>
                  <span className="font-body-md text-body-md font-medium">Compliant</span>
                </div>
              ) : (
                <div className="flex flex-col gap-xs text-[#EF4444]">
                  {complianceData.violations.map((v: string, i: number) => (
                    <div key={i} className="flex items-start gap-sm">
                      <span className="material-symbols-outlined text-[20px]">error</span>
                      <span className="font-body-md text-body-md font-medium">{v}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Column (Map & Logs) */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Map View Placeholder for now */}
        <div className="h-[50%] border-b border-border-subtle relative bg-surface-variant flex items-center justify-center overflow-hidden">
          <img alt="Map View Placeholder" className="absolute inset-0 w-full h-full object-cover opacity-50 grayscale transition-opacity duration-700" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDqpYQypW9Gd34ShFtMRBP7gbsO_2mTPzBRSP1bByv1aJd2hk7URqL7YBIzgbXzezRjVtlU4hi7CbRVySY1LFI8jyZreYz6UqBT2ydeINMbB70HmqN1rkBDo9Wwn0EByKxY0Z3y8zhBFoa1Za7raymrrcqpFNjc0PdOLPgLT9uFzAbmhe8CIfQt3CkF3ulBvVpniPvDZ99q9HqEO5vbrcWLRLBFthD6Vsel1fP8yIhRVYGJPQ3D4ue-BwjzKaIa0AtWTzzs99oPF80" />
          
          {routeData && (
            <div className="absolute top-md right-md bg-surface-container-lowest border border-border-subtle rounded-lg p-md shadow-sm min-w-[200px] animate-slide-in-right delay-300">
              <div className="flex flex-col gap-xs">
                <div className="flex justify-between items-center">
                  <span className="font-label-md text-label-md text-secondary">Total Distance:</span>
                  <span className="font-body-md text-body-md font-medium">{routeData.distance_mi.toFixed(1)} mi</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-label-md text-label-md text-secondary">Est. Drive Time:</span>
                  <span className="font-body-md text-body-md font-medium">{routeData.duration_hr.toFixed(2)}h</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ELD Log Viewer */}
        <div className="h-[50%] p-lg flex flex-col bg-surface-container-lowest animate-fade-in-up delay-300 overflow-y-auto">
          <div className="flex justify-between items-center mb-md shrink-0">
            <h3 className="font-headline-sm text-headline-sm">Log Sheets</h3>
            <div className="flex gap-sm">
              <button className="h-[44px] px-md border border-primary text-primary rounded-lg font-label-md text-label-md hover:bg-surface-container-low transition-colors duration-300 bg-transparent">
                Download PNG
              </button>
            </div>
          </div>
          
          {eldLogs && eldLogs.length > 0 ? (
            <div className="flex-1 flex flex-col gap-md pb-xl">
              {eldLogs.map((log: any, idx: number) => (
                 <div key={idx} className="flex flex-col">
                   <h4 className="font-label-md text-label-md text-secondary mb-sm">Day {log.day}</h4>
                   <img alt={`ELD Log Day ${log.day}`} className="max-w-full object-contain border border-border-subtle rounded-lg bg-surface-variant/20 shadow-sm" src={log.image_b64} />
                 </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center overflow-hidden border border-border-subtle rounded-lg bg-surface-variant/20 p-md relative">
               <div className="text-secondary font-label-md text-label-md">Enter trip details to view ELD logs</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TripPlanner;
