import React, { useEffect, useState } from 'react';
import { useTripStore, type TripHistoryItem } from '../store';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle,
  AlertTriangle,
  Clock,
  MapPin,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  FileText,
} from 'lucide-react';

const TripHistory: React.FC = () => {
  const {
    tripHistory,
    historyLoading,
    historyError,
    historyPage,
    historyTotalPages,
    loadTripHistory,
    loadTripById,
  } = useTripStore();

  const navigate = useNavigate();
  const [loadingTripId, setLoadingTripId] = useState<string | null>(null);

  useEffect(() => {
    loadTripHistory(1);
  }, []);

  const handleViewTrip = async (tripId: string) => {
    setLoadingTripId(tripId);
    await loadTripById(tripId);
    setLoadingTripId(null);
    navigate('/compliance');
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > historyTotalPages) return;
    loadTripHistory(newPage);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Unknown date';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const formatDuration = (hours: number) => {
    if (!hours) return '--';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  // Summary stats
  const totalTrips = tripHistory.length;
  const compliantTrips = tripHistory.filter((t) => t.is_compliant).length;
  const totalMiles = tripHistory.reduce((sum, t) => sum + (t.total_distance_miles || 0), 0);

  return (
    <div className="flex-1 overflow-y-auto bg-background p-md md:p-lg space-y-lg max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-md pb-md border-b border-border-subtle">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">Trip History</h1>
          <p className="font-body-md text-body-md text-text-secondary mt-xs">
            All past trip plans with HOS compliance records and ELD logs.
          </p>
        </div>
        <button
          onClick={() => loadTripHistory(historyPage)}
          disabled={historyLoading}
          className="h-[44px] px-md border border-border-subtle text-secondary bg-transparent rounded-lg font-label-md text-label-md flex items-center gap-sm hover:bg-surface-container-high transition-colors disabled:opacity-50"
        >
          <RefreshCw size={16} className={historyLoading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Summary Stats */}
      {tripHistory.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-md">
          {[
            {
              label: 'Trips Loaded',
              value: totalTrips,
              icon: <FileText size={18} />,
              color: 'text-primary bg-primary-container/15',
            },
            {
              label: 'Compliant Routes',
              value: `${compliantTrips} / ${totalTrips}`,
              icon: <CheckCircle size={18} />,
              color: 'text-emerald-600 bg-emerald-50',
            },
            {
              label: 'Total Miles Planned',
              value: `${totalMiles.toLocaleString('en-US', { maximumFractionDigits: 0 })} mi`,
              icon: <MapPin size={18} />,
              color: 'text-blue-600 bg-blue-50',
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-surface-container-lowest border border-border-subtle rounded-xl p-md flex items-center gap-md"
            >
              <div className={`p-sm rounded-lg ${stat.color}`}>{stat.icon}</div>
              <div>
                <div className="font-headline-sm text-xl font-bold text-on-surface">{stat.value}</div>
                <div className="font-label-md text-xs text-text-secondary">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {historyError && (
        <div className="p-md bg-error-container/15 border border-error-container rounded-xl flex items-start gap-sm">
          <AlertTriangle size={18} className="text-error shrink-0 mt-[1px]" />
          <div>
            <p className="font-label-md text-sm font-semibold text-on-error-container">
              Could not load trip history
            </p>
            <p className="text-xs text-on-error-container/80 mt-xs">{historyError}</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {historyLoading && (
        <div className="flex flex-col gap-md">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="bg-surface-container-lowest border border-border-subtle rounded-xl p-md animate-pulse"
            >
              <div className="flex justify-between items-start mb-md">
                <div className="space-y-sm">
                  <div className="h-4 bg-surface-container-highest rounded w-48" />
                  <div className="h-3 bg-surface-container-highest rounded w-32" />
                </div>
                <div className="h-6 bg-surface-container-highest rounded w-20" />
              </div>
              <div className="h-3 bg-surface-container-highest rounded w-full mt-sm" />
            </div>
          ))}
        </div>
      )}

      {/* Trip Cards */}
      {!historyLoading && tripHistory.length > 0 && (
        <div className="flex flex-col gap-md">
          {tripHistory.map((trip: TripHistoryItem) => (
            <div
              key={trip.trip_id}
              className="bg-surface-container-lowest border border-border-subtle rounded-xl overflow-hidden hover:border-primary-container/50 hover:shadow-sm transition-all duration-200"
            >
              <div className="p-md">
                {/* Top row */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-md mb-md">
                  <div className="flex-1">
                    {/* Route Title */}
                    <div className="flex items-center gap-sm mb-xs">
                      <span
                        className={`px-sm py-[3px] rounded text-[10px] font-bold uppercase tracking-wider ${
                          trip.is_compliant
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-error-container text-on-error-container'
                        }`}
                      >
                        {trip.is_compliant ? '✓ Compliant' : '⚠ Violation'}
                      </span>
                      <span className="font-mono text-[10px] text-text-secondary">{trip.trip_id.slice(0, 8)}...</span>
                    </div>

                    <h3 className="font-headline-sm text-base font-bold text-on-surface">
                      {trip.current_location}
                      <span className="text-text-secondary mx-sm">→</span>
                      {trip.pickup_location}
                      <span className="text-text-secondary mx-sm">→</span>
                      {trip.dropoff_location}
                    </h3>

                    <div className="flex items-center gap-xs mt-xs text-text-secondary">
                      <Clock size={12} />
                      <span className="text-xs">{formatDate(trip.created_at)}</span>
                    </div>
                  </div>

                  {/* Action button */}
                  <button
                    onClick={() => handleViewTrip(trip.trip_id)}
                    disabled={loadingTripId === trip.trip_id}
                    className="h-[36px] px-md bg-primary-container text-on-primary-container rounded-lg font-label-md text-xs hover:brightness-105 transition-all flex items-center gap-xs disabled:opacity-60 shrink-0"
                  >
                    {loadingTripId === trip.trip_id ? (
                      <>
                        <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                        View Details
                      </>
                    )}
                  </button>
                </div>

                {/* Stats Row */}
                <div className="flex flex-wrap gap-md mt-sm">
                  <div className="flex items-center gap-xs">
                    <span className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold">Distance</span>
                    <span className="font-headline-sm text-sm font-bold text-on-surface">
                      {trip.total_distance_miles?.toFixed(1) || '--'} mi
                    </span>
                  </div>
                  <div className="w-px h-4 bg-border-subtle" />
                  <div className="flex items-center gap-xs">
                    <span className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold">Drive Time</span>
                    <span className="font-headline-sm text-sm font-bold text-on-surface">
                      {formatDuration(trip.total_duration_hours)}
                    </span>
                  </div>
                  <div className="w-px h-4 bg-border-subtle" />
                  <div className="flex items-center gap-xs">
                    <span className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold">Days</span>
                    <span className="font-headline-sm text-sm font-bold text-on-surface">
                      {trip.days_required}
                    </span>
                  </div>
                  {trip.has_eld_logs && (
                    <>
                      <div className="w-px h-4 bg-border-subtle" />
                      <div className="flex items-center gap-xs text-emerald-600">
                        <FileText size={12} />
                        <span className="text-xs font-semibold">{trip.eld_log_count} ELD Log{trip.eld_log_count !== 1 ? 's' : ''}</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Violations */}
                {trip.violation_reasons && trip.violation_reasons.length > 0 && (
                  <div className="mt-md pt-md border-t border-border-subtle">
                    <div className="flex flex-col gap-xs">
                      {trip.violation_reasons.slice(0, 2).map((v, i) => (
                        <div key={i} className="flex items-start gap-xs text-error">
                          <AlertTriangle size={12} className="shrink-0 mt-[2px]" />
                          <span className="text-xs">{v}</span>
                        </div>
                      ))}
                      {trip.violation_reasons.length > 2 && (
                        <span className="text-xs text-text-secondary">
                          +{trip.violation_reasons.length - 2} more violation(s)
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!historyLoading && !historyError && tripHistory.length === 0 && (
        <div className="flex flex-col items-center justify-center py-[80px] text-center">
          <span className="material-symbols-outlined text-[64px] text-text-secondary opacity-30 mb-md">
            history
          </span>
          <h3 className="font-headline-sm text-headline-sm text-text-secondary mb-sm">
            No Trip History Yet
          </h3>
          <p className="text-xs text-text-secondary max-w-[300px] mb-lg">
            Plan your first trip using the Trip Planner and your route history will appear here.
          </p>
          <a
            href="/planner"
            className="h-[44px] px-lg bg-primary-container text-on-primary-container rounded-lg font-label-md text-label-md hover:opacity-90 transition-all flex items-center gap-sm"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Plan First Trip
          </a>
        </div>
      )}

      {/* Pagination */}
      {historyTotalPages > 1 && (
        <div className="flex justify-center items-center gap-md py-md">
          <button
            onClick={() => handlePageChange(historyPage - 1)}
            disabled={historyPage === 1 || historyLoading}
            className="p-sm text-secondary hover:text-primary disabled:opacity-30 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="font-label-md text-sm text-text-secondary">
            Page {historyPage} of {historyTotalPages}
          </span>
          <button
            onClick={() => handlePageChange(historyPage + 1)}
            disabled={historyPage === historyTotalPages || historyLoading}
            className="p-sm text-secondary hover:text-primary disabled:opacity-30 transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
};

export default TripHistory;
