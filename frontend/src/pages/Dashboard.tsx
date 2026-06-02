import React from 'react';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  AlertTriangle, 
  MapPin, 
  Navigation, 
  Clock, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

const Dashboard: React.FC = () => {
  // Mock dashboard data
  const stats = [
    { 
      label: 'Active Vehicles', 
      value: '12 / 14', 
      detail: '2 currently in maintenance', 
      icon: Navigation, 
      color: 'text-primary bg-primary-container/10' 
    },
    { 
      label: 'Miles Driven Today', 
      value: '4,812 mi', 
      detail: '+12% from weekly avg', 
      icon: TrendingUp, 
      color: 'text-emerald-600 bg-emerald-50' 
    },
    { 
      label: 'ELD Compliance Rate', 
      value: '91.6%', 
      detail: '1 driver with active warning', 
      icon: ShieldCheck, 
      color: 'text-blue-600 bg-blue-50' 
    },
    { 
      label: 'Active Violations', 
      value: '1', 
      detail: '14-Hour Window exceedance', 
      icon: AlertTriangle, 
      color: 'text-error bg-error-container/15' 
    }
  ];

  const activeTrips = [
    {
      unit: 'Unit 402',
      driver: 'John Doe',
      route: 'Chicago → New York',
      tripId: 'TRP-8924',
      status: 'On Route',
      speed: '65 mph',
      progress: 65,
      compliance: 'Compliant'
    },
    {
      unit: 'Unit 315',
      driver: 'Alex Mercer',
      route: 'LAX → Seattle',
      tripId: 'TRP-8821',
      status: 'On Route',
      speed: '58 mph',
      progress: 88,
      compliance: 'Compliant'
    },
    {
      unit: 'Unit 204',
      driver: 'Sarah Connor',
      route: 'DFW → Chicago',
      tripId: 'TRP-8790',
      status: 'Rest Area',
      speed: '0 mph',
      progress: 42,
      compliance: 'Warning (14h limit)'
    }
  ];

  const complianceAlerts = [
    {
      driver: 'Sarah Connor (Unit 204)',
      violation: '14-Hour Window Alert',
      time: '12 mins ago',
      desc: 'Driver approaching the 14-hour on-duty window limit. Action required: Dispatch rest break instruction.',
      severity: 'high'
    },
    {
      driver: 'Marcus Wright (Unit 102)',
      violation: '30-Minute Break Due',
      time: '1 hr ago',
      desc: 'Driver has operated for 7.5 consecutive hours. Mandated rest break required within 30 minutes.',
      severity: 'medium'
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
        {/* Left 2 Columns: Active Units */}
        <div className="lg:col-span-2 space-y-md">
          <div className="bg-surface-container-lowest border border-border-subtle rounded-xl overflow-hidden">
            <div className="p-md border-b border-border-subtle flex justify-between items-center bg-surface-container-low/50">
              <h2 className="font-headline-sm text-headline-sm text-text-primary">Active Fleet Status</h2>
              <span className="px-sm py-[4px] bg-primary-fixed-dim text-on-primary-fixed rounded-full text-xs font-semibold">
                3 Units On-Road
              </span>
            </div>
            <div className="divide-y divide-border-subtle">
              {activeTrips.map((trip, idx) => (
                <div key={idx} className="p-md hover:bg-surface-container-low/30 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-md mb-md">
                    <div className="flex items-center gap-md">
                      <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center border border-border-subtle text-primary font-bold">
                        {trip.unit.split(' ')[1]}
                      </div>
                      <div>
                        <div className="flex items-center gap-sm">
                          <span className="font-headline-sm text-sm font-semibold text-text-primary">{trip.unit}</span>
                          <span className="font-mono-label text-mono-label bg-surface-container-high px-xs py-0.5 rounded text-[11px]">
                            {trip.tripId}
                          </span>
                        </div>
                        <p className="font-body-md text-xs text-text-secondary mt-xs">{trip.driver} • {trip.route}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-md sm:text-right">
                      <div className="hidden sm:block">
                        <div className="font-headline-sm text-sm font-semibold text-text-primary">{trip.speed}</div>
                        <p className="font-label-md text-[10px] text-text-secondary mt-xs">Current Speed</p>
                      </div>
                      <div>
                        <span className={`inline-flex items-center gap-sm px-sm py-[4px] rounded text-xs font-medium ${
                          trip.compliance.includes('Warning') 
                            ? 'bg-error-container text-on-error-container' 
                            : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            trip.compliance.includes('Warning') ? 'bg-error' : 'bg-emerald-500'
                          }`}></span>
                          {trip.compliance}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-xs">
                    <div className="flex justify-between text-xs text-text-secondary">
                      <span>Progress</span>
                      <span>{trip.progress}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          trip.compliance.includes('Warning') ? 'bg-error' : 'bg-primary-container'
                        }`} 
                        style={{ width: `${trip.progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
              {complianceAlerts.map((alert, idx) => (
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
              ))}
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
