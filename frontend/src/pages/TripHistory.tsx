import React, { useState } from 'react';
import { useTripStore } from '../store';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Calendar, 
  Download, 
  ArrowRight, 
  CheckCircle, 
  AlertTriangle,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface HistoryTrip {
  id: string;
  date: string;
  tripId: string;
  origin: string;
  destination: string;
  distance: string;
  status: 'Compliant' | 'Violation';
  duration?: string;
  breaks?: number;
  violationCode?: string;
  violationDesc?: string;
  actionRequired?: string;
}

const TripHistory: React.FC = () => {
  const { routeData, complianceData, currentLocation, dropoffLocation } = useTripStore();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<'history' | 'active'>('history');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // Pre-populated mockup history list
  const initialHistory: HistoryTrip[] = [
    {
      id: 'trip-1',
      date: 'Oct 24, 2026',
      tripId: 'TRP-8821',
      origin: 'LAX',
      destination: 'SEA',
      distance: '1,135 mi',
      status: 'Compliant',
      duration: '18h 45m',
      breaks: 3
    },
    {
      id: 'trip-2',
      date: 'Oct 21, 2026',
      tripId: 'TRP-8790',
      origin: 'DFW',
      destination: 'ORD',
      distance: '925 mi',
      status: 'Violation',
      violationCode: 'HOS-14H',
      violationDesc: 'Driver exceeded the 14-hour duty limit by 45 minutes on Oct 22, 2026.',
      actionRequired: 'Acknowledge violation and review scheduling protocols.'
    },
    {
      id: 'trip-3',
      date: 'Oct 18, 2026',
      tripId: 'TRP-8742',
      origin: 'MIA',
      destination: 'ATL',
      distance: '660 mi',
      status: 'Compliant',
      duration: '11h 15m',
      breaks: 1
    }
  ];

  // If a trip has been computed in the planner, prepend it to the list dynamically!
  const calculatedTrip: HistoryTrip | null = routeData && complianceData ? {
    id: 'calculated-trip',
    date: 'Today',
    tripId: 'TRP-8924',
    origin: currentLocation.split(',')[0].toUpperCase(),
    destination: dropoffLocation.split(',')[0].toUpperCase(),
    distance: `${routeData.distance_mi.toFixed(0)} mi`,
    status: complianceData.is_compliant ? 'Compliant' : 'Violation',
    duration: `${routeData.duration_hr.toFixed(1)}h`,
    breaks: Math.ceil(routeData.distance_mi / 1000) || 1,
    violationCode: complianceData.is_compliant ? undefined : 'HOS-LIMIT',
    violationDesc: complianceData.is_compliant ? undefined : complianceData.violations.join(', ')
  } : null;

  const allTrips = calculatedTrip 
    ? [calculatedTrip, ...initialHistory]
    : initialHistory;

  // Filter trips based on search query
  const filteredTrips = allTrips.filter(trip => {
    const searchString = `${trip.origin} ${trip.destination} ${trip.tripId}`.toLowerCase();
    return searchString.includes(searchQuery.toLowerCase());
  });

  const toggleDetails = (rowId: string) => {
    setExpandedRow(prev => (prev === rowId ? null : rowId));
  };

  return (
    <div className="flex-1 overflow-y-auto bg-background p-md md:p-lg space-y-lg max-w-7xl mx-auto w-full">
      {/* Page Header */}
      <header className="mb-xl">
        <h1 className="font-headline-lg text-headline-lg text-text-primary mb-md">Trip Management</h1>
        
        {/* Navigation Tabs */}
        <div className="flex gap-lg border-b border-border-subtle">
          <button 
            onClick={() => setActiveTab('active')}
            className={`pb-sm font-label-md text-label-md transition-colors ${
              activeTab === 'active' 
                ? 'text-primary border-b-2 border-primary font-semibold' 
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Active Trips
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`pb-sm font-label-md text-label-md transition-colors ${
              activeTab === 'history' 
                ? 'text-primary border-b-2 border-primary font-semibold' 
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            History
          </button>
        </div>
      </header>

      {activeTab === 'active' ? (
        // Active Trips View
        <div className="space-y-md">
          {calculatedTrip ? (
            <div className="bg-surface-container-lowest border border-border-subtle rounded-xl p-md flex flex-col md:flex-row justify-between items-start md:items-center gap-md">
              <div className="flex items-center gap-md">
                <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[24px]">local_shipping</span>
                </div>
                <div>
                  <div className="flex items-center gap-sm">
                    <h3 className="font-headline-sm text-base text-text-primary">
                      {currentLocation} → {dropoffLocation}
                    </h3>
                    <span className="font-mono text-xs bg-surface-container-high px-xs py-0.5 rounded">
                      TRP-8924
                    </span>
                  </div>
                  <p className="font-body-md text-xs text-text-secondary mt-xs">
                    Driver: John Doe • Status: On Route
                  </p>
                </div>
              </div>
              <div className="flex gap-sm w-full md:w-auto">
                <button 
                  onClick={() => navigate('/map')}
                  className="flex-1 md:flex-initial h-[40px] px-md border border-primary text-primary rounded-lg font-label-md text-xs hover:bg-surface-container-low transition-colors"
                >
                  Live Tracking
                </button>
                <button 
                  onClick={() => navigate('/compliance')}
                  className="flex-1 md:flex-initial h-[40px] px-md bg-primary-container text-on-primary-container rounded-lg font-label-md text-xs hover:opacity-90 transition-opacity"
                >
                  Compliance Log
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-surface-container-lowest border border-border-subtle rounded-xl p-xl text-center">
              <p className="font-body-md text-text-secondary">No active dispatch trips found.</p>
              <button 
                onClick={() => navigate('/planner')}
                className="mt-md px-md py-sm bg-primary-container text-on-primary-container rounded-lg font-label-md text-xs hover:scale-102 transition-transform"
              >
                Plan a New Trip
              </button>
            </div>
          )}
        </div>
      ) : (
        // Trip History View
        <div className="space-y-md">
          {/* Filters Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-end justify-between gap-md">
            <div className="flex flex-col sm:flex-row gap-md flex-1">
              <div className="relative flex-1 max-w-sm">
                <label className="block font-label-md text-label-md text-text-secondary mb-xs">Search Routes or IDs</label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 text-text-secondary" size={18} />
                  <input 
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full border-0 border-b border-border-subtle bg-transparent pl-10 pb-xs focus:ring-0 focus:border-primary transition-colors text-sm text-text-primary"
                    placeholder="e.g. LAX or TRP"
                  />
                </div>
              </div>
              <div className="relative w-48">
                <label className="block font-label-md text-label-md text-text-secondary mb-xs">Date Range</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 text-text-secondary" size={18} />
                  <input 
                    type="text"
                    readOnly
                    className="w-full border-0 border-b border-border-subtle bg-transparent pl-10 pb-xs focus:ring-0 text-sm text-text-primary cursor-default"
                    value="June 2026"
                  />
                </div>
              </div>
            </div>
            <button 
              onClick={() => alert('Report exported successfully!')}
              className="h-[44px] px-lg border border-primary text-primary rounded-lg font-label-md text-xs font-semibold hover:bg-surface-container-low transition-colors flex items-center justify-center gap-xs"
            >
              <Download size={16} />
              Export Report
            </button>
          </div>

          {/* Data Table */}
          <div className="bg-surface-container-lowest border border-border-subtle rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-border-subtle">
                  <th className="px-md py-sm font-label-md text-xs text-text-secondary font-semibold w-1/4">Date Completed</th>
                  <th className="px-md py-sm font-label-md text-xs text-text-secondary font-semibold w-2/4">Route Summary</th>
                  <th className="px-md py-sm font-label-md text-xs text-text-secondary font-semibold w-1/6">Total Distance</th>
                  <th className="px-md py-sm font-label-md text-xs text-text-secondary font-semibold w-1/6">Log Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {filteredTrips.length > 0 ? (
                  filteredTrips.map(trip => {
                    const isExpanded = expandedRow === trip.id;
                    const isViolation = trip.status === 'Violation';

                    return (
                      <React.Fragment key={trip.id}>
                        <tr 
                          onClick={() => toggleDetails(trip.id)}
                          className="cursor-pointer hover:bg-surface-container-low/40 transition-colors group"
                        >
                          <td className="px-md py-md font-body-md text-sm text-text-primary">{trip.date}</td>
                          <td className="px-md py-md font-body-md text-sm text-text-primary">
                            <div className="flex items-center gap-sm">
                              <span className="font-mono text-xs bg-surface-container-high px-xs py-0.5 rounded">
                                {trip.tripId}
                              </span>
                              <span>{trip.origin}</span>
                              <ArrowRight size={14} className="text-text-secondary" />
                              <span>{trip.destination}</span>
                              {isExpanded ? <ChevronUp size={16} className="text-text-secondary ml-auto" /> : <ChevronDown size={16} className="text-text-secondary ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />}
                            </div>
                          </td>
                          <td className="px-md py-md font-body-md text-sm text-text-secondary">{trip.distance}</td>
                          <td className="px-md py-md">
                            <span className={`inline-flex items-center gap-xs px-sm py-[4px] rounded text-xs font-semibold ${
                              isViolation 
                                ? 'bg-error-container text-on-error-container' 
                                : 'bg-emerald-50 text-emerald-700'
                            }`}>
                              {isViolation ? <AlertTriangle size={12} /> : <CheckCircle size={12} />}
                              {trip.status}
                            </span>
                          </td>
                        </tr>
                        
                        {/* Expanded details row */}
                        {isExpanded && (
                          <tr className="bg-surface-bright">
                            <td colSpan={4} className="p-0">
                              <div className={`p-lg border-l-4 transition-all duration-300 ${
                                isViolation ? 'border-error bg-red-50/10' : 'border-primary bg-blue-50/5'
                              }`}>
                                {isViolation ? (
                                  // Violation breakdown view
                                  <div className="space-y-md">
                                    <div className="flex items-start justify-between">
                                      <h4 className="font-headline-sm text-sm font-bold text-text-primary">HOS Violation Details</h4>
                                      <span className="bg-error-container text-on-error-container font-mono px-sm py-0.5 rounded text-[11px] font-semibold">
                                        Code: {trip.violationCode}
                                      </span>
                                    </div>
                                    <div className="bg-surface-container-lowest border border-border-subtle rounded-lg p-md">
                                      <p className="font-body-md text-xs text-text-primary">
                                        <strong className="font-semibold text-error">Description: </strong> 
                                        {trip.violationDesc}
                                      </p>
                                      {trip.actionRequired && (
                                        <p className="font-body-md text-xs text-text-secondary mt-xs">
                                          <strong>Action Required: </strong> 
                                          {trip.actionRequired}
                                        </p>
                                      )}
                                    </div>
                                    <div className="flex gap-sm">
                                      <button 
                                        onClick={() => alert('Violation acknowledged.')}
                                        className="h-[40px] px-md bg-primary-container text-on-primary-container rounded-lg font-label-md text-xs font-semibold hover:opacity-90 transition-opacity"
                                      >
                                        Acknowledge
                                      </button>
                                      <button 
                                        onClick={() => navigate('/compliance')}
                                        className="h-[40px] px-md border border-border-subtle text-text-primary rounded-lg font-label-md text-xs font-semibold hover:bg-surface-container-low transition-colors flex items-center gap-xs"
                                      >
                                        View Full ELD Log
                                        <ExternalLink size={12} />
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  // Compliant breakdown view
                                  <div className="space-y-md">
                                    <h4 className="font-headline-sm text-sm font-bold text-text-primary">HOS Logs Summary</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-md">
                                      <div className="bg-surface-container-lowest border border-border-subtle rounded-lg p-md">
                                        <span className="font-label-md text-[10px] text-text-secondary block mb-xs">Driving Time</span>
                                        <span className="font-headline-md text-base font-bold text-text-primary">{trip.duration}</span>
                                      </div>
                                      <div className="bg-surface-container-lowest border border-border-subtle rounded-lg p-md">
                                        <span className="font-label-md text-[10px] text-text-secondary block mb-xs">Rest Breaks</span>
                                        <span className="font-headline-md text-base font-bold text-text-primary">{trip.breaks}</span>
                                      </div>
                                      <div className="bg-surface-container-lowest border border-border-subtle rounded-lg p-md">
                                        <span className="font-label-md text-[10px] text-text-secondary block mb-xs">Exceptions</span>
                                        <span className="font-headline-md text-base font-bold text-emerald-600">0</span>
                                      </div>
                                    </div>
                                    <div className="flex justify-end">
                                      <button 
                                        onClick={() => navigate('/compliance')}
                                        className="text-primary hover:underline font-label-md text-xs font-semibold flex items-center gap-xs"
                                      >
                                        View Full ELD Log
                                        <ExternalLink size={12} />
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="px-md py-xl text-center text-text-secondary">
                      No matching trips found in history.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default TripHistory;
