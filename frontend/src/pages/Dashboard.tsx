import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  AlertTriangle, 
  MapPin, 
  Navigation, 
  Clock, 
  ArrowRight,
  ShieldCheck,
  Map,
  PlayCircle
} from 'lucide-react';
import { useTripStore } from '../store';

const Dashboard: React.FC = () => {
  const { tripHistory, loadTripHistory } = useTripStore();
  const navigate = useNavigate();

  useEffect(() => {
    loadTripHistory(1);
  }, [loadTripHistory]);

  const totalTrips = tripHistory.length;
  const totalMiles = tripHistory.reduce((sum, trip) => sum + trip.total_distance_miles, 0);
  const totalViolations = tripHistory.reduce((sum, trip) => sum + trip.violation_reasons.length, 0);
  const nonCompliantTrips = tripHistory.filter(trip => !trip.is_compliant).length;

  const complianceAlerts = tripHistory
    .filter(trip => !trip.is_compliant)
    .map(trip => ({
      driver: `Trip ID: ${trip.trip_id.substring(0, 8).toUpperCase()}`,
      violation: trip.violation_reasons[0] || 'Hours of Service Violation',
      time: trip.created_at ? new Date(trip.created_at).toLocaleDateString() : 'Recent',
      desc: trip.violation_reasons.join(', ') || 'The planned route violates standard FMCSA Hours of Service regulations.',
      severity: 'high' as const
    }));

  const stats = [
    { 
      label: 'Total Trips', 
      value: totalTrips.toString(), 
      detail: 'Completed in history', 
      icon: Navigation, 
      color: 'text-primary bg-primary-container/10' 
    },
    { 
      label: 'Total Miles Driven', 
      value: `${Math.round(totalMiles)} mi`, 
      detail: 'Lifetime fleet mileage', 
      icon: TrendingUp, 
      color: 'text-emerald-600 bg-emerald-50' 
    },
    { 
      label: 'Compliance Rate', 
      value: totalTrips > 0 ? `${Math.round(((totalTrips - nonCompliantTrips) / totalTrips) * 100)}%` : '0%', 
      detail: `${nonCompliantTrips} trips with violations`, 
      icon: ShieldCheck, 
      color: 'text-blue-600 bg-blue-50' 
    },
    { 
      label: 'Active Violations', 
      value: totalViolations.toString(), 
      detail: 'Total logged incidents', 
      icon: AlertTriangle, 
      color: 'text-error bg-error-container/15' 
    }
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-background p-md md:p-lg space-y-lg max-w-7xl mx-auto w-full">
      {/* Welcome & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-md pb-md border-b border-border-subtle">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-text-primary">Logistics Intelligence</h1>
          <p className="font-body-md text-body-md text-text-secondary mt-xs">
            Real-time fleet overview, route status, and FMCSA compliance metrics.
          </p>
        </div>
        <div className="flex items-center gap-sm">
          <Link 
            to="/planner" 
            className="h-[44px] px-md bg-primary-container text-on-primary-container rounded-lg font-label-md text-label-md hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-sm shadow-sm"
          >
            Create New Trip
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-surface-container-lowest border border-border-subtle rounded-xl p-md flex flex-col justify-between hover:border-primary-container/30 transition-all duration-300">
            <div className="flex justify-between items-start">
              <span className="font-label-md text-label-md text-text-secondary uppercase tracking-wider">{stat.label}</span>
              <div className={`p-sm rounded-lg ${stat.color}`}>
                <stat.icon size={20} />
              </div>
            </div>
            <div className="mt-md">
              <div className="font-headline-lg text-headline-lg text-text-primary font-bold">{stat.value}</div>
              <div className="font-label-md text-label-md text-text-secondary mt-xs">{stat.detail}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid: Active Units & Compliance Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
        {/* Left 2 Columns: Trip History */}
        <div className="lg:col-span-2 space-y-md">
          <div className="bg-surface-container-lowest border border-border-subtle rounded-xl overflow-hidden flex flex-col min-h-[400px]">
            <div className="p-md border-b border-border-subtle flex justify-between items-center bg-surface-container-low/50">
              <h2 className="font-headline-sm text-headline-sm text-text-primary">Recent Trip History</h2>
              <span className="px-sm py-[4px] bg-primary-fixed-dim text-on-primary-fixed rounded-full text-xs font-semibold">
                {totalTrips} Total
              </span>
            </div>
            
            {totalTrips === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-xl">
                <Map size={48} className="text-primary/30 mb-md" />
                <h3 className="font-title-lg text-title-lg text-on-surface mb-xs">No trips recorded yet</h3>
                <p className="text-secondary font-body-md text-body-md max-w-[300px] mb-lg">
                  Get started by planning your first route. The system will automatically check for HOS compliance.
                </p>
                <button 
                  onClick={() => navigate('/planner')}
                  className="bg-primary text-on-primary px-lg py-sm rounded-full font-label-lg font-bold flex items-center gap-sm hover:brightness-110 active:scale-95 transition-all"
                >
                  <PlayCircle size={20} />
                  Plan Your First Route
                </button>
              </div>
            ) : (
              <div className="divide-y divide-border-subtle">
                {tripHistory.slice(0, 3).map((trip) => (
                  <div key={trip.trip_id} className="p-md hover:bg-surface-container-low/30 transition-colors">
                    <div className="flex justify-between items-start mb-md">
                      <div>
                        <div className="font-headline-sm text-sm font-semibold text-text-primary">
                          {trip.pickup_location.split(',')[0]} → {trip.dropoff_location.split(',')[0]}
                        </div>
                        <p className="text-xs text-text-secondary">ID: {trip.trip_id}</p>
                      </div>
                      <div className="text-right">
                        <div className="font-headline-sm text-sm font-semibold text-text-primary">{Math.round(trip.total_distance_miles)} mi</div>
                        <span className={`inline-flex items-center gap-sm px-sm py-[4px] rounded text-xs font-medium ${
                          !trip.is_compliant ? 'bg-error-container text-on-error-container' : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${!trip.is_compliant ? 'bg-error' : 'bg-emerald-500'}`}></span>
                          {trip.is_compliant ? 'Compliant' : 'Warning'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="p-md border-t border-border-subtle bg-surface-container-lowest text-center">
              <Link to="/history" className="text-primary hover:underline font-label-md text-label-md inline-flex items-center gap-xs">
                View All Trips and Logs
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>

        {/* Right 1 Column: Compliance Monitoring */}
        <div className="space-y-md">
          <div className="bg-surface-container-lowest border border-border-subtle rounded-xl p-md">
            <h3 className="font-headline-sm text-headline-sm text-text-primary mb-md flex items-center gap-sm">
              <ShieldCheck className="text-primary" size={20} />
              Compliance Alerts
            </h3>
            <div className="space-y-md">
              {complianceAlerts.length === 0 ? (
                <div className="text-center p-md border border-dashed border-border-subtle rounded-xl text-text-secondary font-body-md text-xs">
                  No active compliance alerts.
                </div>
              ) : (
                complianceAlerts.map((alert, idx) => (
                  <div key={idx} className={`p-md border rounded-xl ${
                    alert.severity === 'high' 
                      ? 'border-error-container bg-error-container/10 text-on-error-container' 
                      : 'border-amber-200 bg-amber-50/50 text-amber-900'
                  }`}>
                    <div className="flex justify-between items-start">
                      <div className="font-label-md text-xs font-semibold">{alert.driver}</div>
                      <span className="text-[10px] text-text-secondary">{alert.time}</span>
                    </div>
                    <div className="font-headline-sm text-sm font-bold mt-xs">{alert.violation}</div>
                    <p className="font-body-md text-xs text-text-secondary mt-sm line-clamp-3 leading-relaxed">
                      {alert.desc}
                    </p>
                  </div>
                ))
              )}
            </div>
            <div className="mt-md pt-md border-t border-border-subtle text-center">
              <Link to="/compliance" className="text-primary hover:underline font-label-md text-label-md inline-flex items-center gap-xs">
                Manage Driver Audits
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="bg-surface-container-lowest border border-border-subtle rounded-xl p-md">
            <h3 className="font-headline-sm text-headline-sm text-text-primary mb-md">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-sm">
              <Link to="/planner" className="p-md bg-surface-container-low hover:bg-surface-container-high border border-border-subtle rounded-lg flex flex-col items-center justify-center text-center transition-colors">
                <Navigation className="text-primary mb-xs" size={24} />
                <span className="font-label-md text-xs font-semibold text-text-primary">Plan Route</span>
              </Link>
              <Link to="/map" className="p-md bg-surface-container-low hover:bg-surface-container-high border border-border-subtle rounded-lg flex flex-col items-center justify-center text-center transition-colors">
                <MapPin className="text-primary mb-xs" size={24} />
                <span className="font-label-md text-xs font-semibold text-text-primary">Live Tracking</span>
              </Link>
              <Link to="/compliance" className="p-md bg-surface-container-low hover:bg-surface-container-high border border-border-subtle rounded-lg flex flex-col items-center justify-center text-center transition-colors">
                <ShieldCheck className="text-primary mb-xs" size={24} />
                <span className="font-label-md text-xs font-semibold text-text-primary">HOS Rules</span>
              </Link>
              <Link to="/history" className="p-md bg-surface-container-low hover:bg-surface-container-high border border-border-subtle rounded-lg flex flex-col items-center justify-center text-center transition-colors">
                <Clock className="text-primary mb-xs" size={24} />
                <span className="font-label-md text-xs font-semibold text-text-primary">Logs Archive</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
