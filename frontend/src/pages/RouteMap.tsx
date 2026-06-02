import React, { useState } from 'react';
import { useTripStore } from '../store';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Fuel, Package, Info, Menu, Navigation } from 'lucide-react';

// ── Custom map icons ──────────────────────────────────────────────────────────
const makeIcon = (html: string, size: [number, number]) =>
  L.divIcon({ className: 'custom-leaflet-icon', html, iconSize: size, iconAnchor: [size[0] / 2, size[1] / 2] });

const startIcon = makeIcon(
  `<div style="width:20px;height:20px;border-radius:50%;background:#fff;border:4px solid #2563EB;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>`,
  [20, 20]
);
const pickupIcon = makeIcon(
  `<div style="width:24px;height:24px;border-radius:50%;background:#2563EB;border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:bold;font-size:11px;font-family:sans-serif">P</div>`,
  [24, 24]
);
const dropoffIcon = makeIcon(
  `<div style="width:22px;height:22px;border-radius:4px;background:#09090b;border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:bold;font-size:10px;font-family:sans-serif">D</div>`,
  [22, 22]
);
const fuelIcon = makeIcon(
  `<div style="width:20px;height:20px;border-radius:50%;background:#F59E0B;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:#fff;font-size:10px">⛽</div>`,
  [20, 20]
);

// Auto-fit map to polyline bounds
const FitBounds: React.FC<{ points: [number, number][] }> = ({ points }) => {
  const map = useMap();
  React.useEffect(() => {
    if (points && points.length > 1) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [points, map]);
  return null;
};

// ── Default mock data for when no trip is calculated ─────────────────────────
const DEFAULT_ROUTE: [number, number][] = [
  [41.8781, -87.6298], // Chicago
  [42.3314, -83.0458], // Detroit
  [41.2033, -77.1945], // Bloomsburg
  [40.7128, -74.0060], // New York
];

const DEFAULT_FUEL_STOPS = [
  { lat: 41.6528, lng: -83.5379, label: 'Flying J – Toledo, OH' },
  { lat: 41.0037, lng: -76.4511, label: 'Pilot – Bloomsburg, PA' },
];

const DEFAULT_DIRECTIONS = [
  { type: 'start', time: '08:00', title: 'Start Trip', location: 'Chicago Logistics Hub, IL', note: 'Driver pre-trip inspection complete.' },
  { type: 'segment', road: 'I-94 E', distance: '280 mi', description: 'Continue on I-94 East toward Detroit.' },
  { type: 'pickup', time: '12:15', title: 'Pickup Load', location: 'Detroit Auto Parts, MI', tag: 'REQ', note: 'Gate 4, speak to Receiving.' },
  { type: 'fuel', time: '14:30', title: 'Fuel Stop', location: 'Flying J – Toledo, OH', note: 'Scheduled fuel & HOS 30-min mandatory break.' },
  { type: 'segment', road: 'I-80 E', distance: '410 mi', description: 'Merge onto I-80 East via Ohio Turnpike.' },
  { type: 'fuel', time: '20:45', title: 'Rest & Fuel', location: 'Pilot – Bloomsburg, PA', note: 'Scheduled overnight HOS rest period.' },
  { type: 'dropoff', time: 'Est.', title: 'Dropoff', location: 'Queens Distribution Center, NY', note: 'Final delivery destination.' },
];

// ── Component ─────────────────────────────────────────────────────────────────
const RouteMap: React.FC = () => {
  const { routeData, complianceData, currentLocation, pickupLocation, dropoffLocation } = useTripStore();
  const [panelOpen, setPanelOpen] = useState(true);

  const hasRoute = routeData && routeData.polyline && routeData.polyline.length > 1;

  // Build leaflet-ready [lat, lng] pairs
  const polylineCoords: [number, number][] = hasRoute
    ? routeData.polyline.map(([lng, lat]: [number, number]) => [lat, lng] as [number, number])
    : DEFAULT_ROUTE;

  const startCoords = hasRoute && routeData.start_coords
    ? [routeData.start_coords.lat, routeData.start_coords.lng] as [number, number]
    : polylineCoords[0];

  const pickupCoords = hasRoute && routeData.pickup_coords
    ? [routeData.pickup_coords.lat, routeData.pickup_coords.lng] as [number, number]
    : polylineCoords[Math.floor(polylineCoords.length / 3)];

  const dropoffCoords = hasRoute && routeData.dropoff_coords
    ? [routeData.dropoff_coords.lat, routeData.dropoff_coords.lng] as [number, number]
    : polylineCoords[polylineCoords.length - 1];

  const fuelStops: { lat: number; lng: number; label: string }[] = hasRoute && routeData.fuel_stop_positions
    ? routeData.fuel_stop_positions
    : DEFAULT_FUEL_STOPS;

  const distanceMiles = hasRoute ? routeData.distance_mi : 812.4;
  const durationHours = hasRoute ? routeData.duration_hr : 14.76;
  const mapCenter = polylineCoords[Math.floor(polylineCoords.length / 2)] || [39.8283, -98.5795];

  // Build dynamic directions from compliance segments when available
  const directions = hasRoute && complianceData?.daily_segments?.length > 0
    ? buildDirectionsFromSegments(complianceData.daily_segments, currentLocation, pickupLocation, dropoffLocation)
    : DEFAULT_DIRECTIONS;

  const iconMap: Record<string, React.ReactNode> = {
    start: <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />,
    pickup: <Package size={11} className="text-white" />,
    fuel: <Fuel size={11} className="text-gray-500" />,
    dropoff: <div className="w-2 h-2 bg-zinc-900 rounded-sm" />,
  };
  const borderMap: Record<string, string> = {
    start: 'border-blue-600 bg-white',
    pickup: 'bg-blue-600 border-blue-600',
    fuel: 'bg-white border-zinc-400',
    dropoff: 'border-zinc-900 bg-white',
  };

  return (
    <div className="flex-1 flex h-full w-full relative overflow-hidden">
      {/* Mobile panel toggle */}
      <button
        onClick={() => setPanelOpen(!panelOpen)}
        className="md:hidden absolute top-md left-md z-30 bg-surface-container-lowest border border-border-subtle w-10 h-10 rounded-lg flex items-center justify-center text-text-primary shadow-md"
      >
        <Menu size={20} />
      </button>

      {/* ── Left Panel: Directions ── */}
      <aside
        className={`w-[360px] bg-surface-container-lowest border-r border-border-subtle h-full flex flex-col absolute md:relative z-20 shadow-lg md:shadow-none transition-transform duration-300 ${
          panelOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Panel header */}
        <div className="p-lg border-b border-border-subtle bg-surface-bright sticky top-0 z-10 shrink-0">
          <div className="flex items-center gap-xs mb-xs">
            <span className="px-sm py-[2px] bg-surface-container-high text-text-primary rounded text-[10px] font-bold uppercase tracking-wider">
              {hasRoute ? 'Calculated Route' : 'Example Route'}
            </span>
          </div>
          <h2 className="font-headline-md text-headline-sm text-on-surface mb-md">
            {currentLocation || 'Chicago'} → {dropoffLocation || 'New York'}
          </h2>
          <div className="grid grid-cols-2 gap-sm">
            <div className="bg-surface p-sm rounded-lg border border-border-subtle">
              <span className="font-label-md text-[10px] text-text-secondary block">Est. Drive Time</span>
              <span className="font-headline-sm text-sm text-[#2563EB] font-bold">{durationHours.toFixed(2)} hrs</span>
            </div>
            <div className="bg-surface p-sm rounded-lg border border-border-subtle">
              <span className="font-label-md text-[10px] text-text-secondary block">Total Distance</span>
              <span className="font-headline-sm text-sm text-on-surface font-bold">{distanceMiles.toFixed(1)} mi</span>
            </div>
          </div>
          {!hasRoute && (
            <p className="mt-sm text-[10px] text-text-secondary italic">
              Use Trip Planner to calculate a real route.
            </p>
          )}
        </div>

        {/* Directions list */}
        <div className="flex-1 overflow-y-auto p-md relative">
          <div className="absolute left-[39px] top-[30px] bottom-[30px] w-px bg-border-subtle pointer-events-none" />
          {directions.map((step: any, idx: number) => {
            if (step.type === 'segment') {
              return (
                <div key={idx} className="flex gap-md mb-md relative z-10 pl-[48px]">
                  <div className="flex-1 bg-surface border border-border-subtle rounded-lg p-sm">
                    <div className="flex justify-between items-center mb-xs">
                      <span className="font-label-md text-xs font-semibold text-[#2563EB]">{step.road}</span>
                      <span className="font-mono text-xs text-text-secondary">{step.distance}</span>
                    </div>
                    <p className="text-xs text-text-secondary">{step.description}</p>
                  </div>
                </div>
              );
            }
            return (
              <div key={idx} className="flex gap-md mb-md relative z-10">
                <div className="w-12 text-right pt-xs">
                  <span className="font-mono text-[11px] text-text-secondary font-medium">{step.time}</span>
                </div>
                <div className="w-6 h-6 rounded-full border flex items-center justify-center z-10 shrink-0 mt-[2px] {borderMap[step.type] || 'bg-white border-zinc-400'}">
                  <div className={`w-6 h-6 rounded-full border flex items-center justify-center ${borderMap[step.type] || 'bg-white border-zinc-400'}`}>
                    {iconMap[step.type]}
                  </div>
                </div>
                <div className="flex-1 pb-xs">
                  <div className="flex items-center gap-xs">
                    <h4 className="font-label-md text-xs font-bold text-on-surface">{step.title}</h4>
                    {step.tag && (
                      <span className="px-xs py-0.5 bg-secondary-container text-on-secondary-container rounded text-[9px] font-bold">
                        {step.tag}
                      </span>
                    )}
                  </div>
                  <p className="font-body-md text-xs text-text-secondary mt-xs">{step.location}</p>
                  {step.note && (
                    <div className="bg-surface-container-high rounded p-xs text-[11px] text-on-surface-variant flex items-center gap-xs mt-xs">
                      <Info size={11} className="shrink-0 text-text-secondary" />
                      <span>{step.note}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      {/* ── Leaflet Map ── */}
      <div className="flex-1 h-full w-full relative z-10">
        <MapContainer
          center={mapCenter}
          zoom={6}
          className="w-full h-full"
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitBounds points={polylineCoords} />

          <Polyline
            positions={polylineCoords}
            color="#2563EB"
            weight={4}
            opacity={0.85}
            dashArray={hasRoute ? undefined : '8 6'}
          />

          <Marker position={startCoords} icon={startIcon}>
            <Popup>
              <b className="text-xs">Start</b>
              <p className="text-xs text-gray-500">{currentLocation || 'Chicago, IL'}</p>
            </Popup>
          </Marker>

          <Marker position={pickupCoords} icon={pickupIcon}>
            <Popup>
              <b className="text-xs">Pickup</b>
              <p className="text-xs text-gray-500">{pickupLocation || 'Detroit, MI'}</p>
            </Popup>
          </Marker>

          {fuelStops.map((stop, idx) => (
            <Marker key={idx} position={[stop.lat, stop.lng]} icon={fuelIcon}>
              <Popup>
                <b className="text-xs">Fuel / Rest Stop</b>
                <p className="text-xs text-gray-500">{stop.label}</p>
              </Popup>
            </Marker>
          ))}

          <Marker position={dropoffCoords} icon={dropoffIcon}>
            <Popup>
              <b className="text-xs">Dropoff</b>
              <p className="text-xs text-gray-500">{dropoffLocation || 'New York, NY'}</p>
            </Popup>
          </Marker>
        </MapContainer>

        {/* Floating info pill */}
        <div className="absolute top-md right-md z-20 bg-surface/90 backdrop-blur-sm border border-border-subtle px-md py-sm rounded-full shadow-md flex items-center gap-sm">
          <span className="font-mono text-xs font-semibold text-on-surface">{distanceMiles.toFixed(1)} mi</span>
          <div className="w-1 h-1 rounded-full bg-zinc-300" />
          <span className="font-mono text-xs font-semibold text-on-surface">{durationHours.toFixed(2)} hrs</span>
          <div className="w-1 h-1 rounded-full bg-zinc-300" />
          <Fuel size={13} className="text-text-secondary" />
          <span className="font-label-md text-xs text-text-secondary">{fuelStops.length} stops</span>
        </div>

        {/* Status chip */}
        <div className="absolute bottom-md left-1/2 -translate-x-1/2 z-20 bg-surface border border-border-subtle px-md py-sm rounded-xl shadow-md flex items-center gap-md">
          <div className="flex items-center gap-sm">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="font-label-md text-xs font-bold text-on-surface">
              {hasRoute ? 'Route Calculated' : 'Example Route'}
            </span>
          </div>
          <div className="h-4 w-px bg-border-subtle" />
          <span className="font-mono text-xs text-text-secondary">
            {hasRoute ? `${complianceData?.days_required || '--'} days` : 'Plan a trip first'}
          </span>
        </div>
      </div>
    </div>
  );
};

// ── Helper: Build turn-by-turn list from HOS daily segments ──────────────────
function buildDirectionsFromSegments(
  segments: any[],
  from: string,
  pickup: string,
  dropoff: string
): any[] {
  const dirs: any[] = [
    { type: 'start', time: '08:00', title: 'Start Trip', location: from, note: 'Pre-trip inspection complete.' },
  ];

  segments.forEach((seg, dIdx) => {
    if (dIdx === 0) {
      dirs.push({ type: 'segment', road: 'Interstate', distance: '--', description: `Day ${seg.day}: Drive ${seg.total_driving_hours.toFixed(1)}h toward ${pickup}.` });
      dirs.push({ type: 'pickup', time: '--', title: 'Pickup Load', location: pickup, tag: 'REQ', note: 'Consult consignee at dock.' });
    } else {
      dirs.push({ type: 'segment', road: 'Interstate', distance: '--', description: `Day ${seg.day}: Drive ${seg.total_driving_hours.toFixed(1)}h toward ${dropoff}.` });
    }

    const hasFuel = seg.activities?.some((a: any) => a.label === 'Fuel Stop');
    if (hasFuel) {
      const fuelAct = seg.activities.find((a: any) => a.label === 'Fuel Stop');
      dirs.push({ type: 'fuel', time: fuelAct?.start_str || '--', title: 'Fuel Stop', location: 'Truck Stop', note: 'Scheduled fuel & HOS break.' });
    }

    const restAct = seg.activities?.find((a: any) => a.status === 'off_duty' && a.duration > 8);
    if (restAct && dIdx < segments.length - 1) {
      dirs.push({ type: 'fuel', time: restAct.start_str, title: 'Overnight Rest', location: 'Rest Area', note: `10-hour mandatory rest period.` });
    }
  });

  dirs.push({ type: 'dropoff', time: 'Est.', title: 'Dropoff', location: dropoff, note: 'Final delivery destination.' });
  return dirs;
}

export default RouteMap;
