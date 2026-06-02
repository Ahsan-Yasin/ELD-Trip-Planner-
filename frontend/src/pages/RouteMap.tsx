import React, { useState } from 'react';
import { useTripStore } from '../store';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { 
  Fuel, 
  Package, 
  Info, 
  Menu
} from 'lucide-react';

// Setup custom div icons to match the design system aesthetics and avoid Leaflet default asset loading bugs
const startIcon = L.divIcon({
  className: 'custom-leaflet-icon',
  html: `<div class="w-5 h-5 rounded-full bg-white border-4 border-blue-600 shadow-md flex items-center justify-center"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10]
});

const pickupIcon = L.divIcon({
  className: 'custom-leaflet-icon',
  html: `<div class="w-6 h-6 rounded-full bg-blue-600 border-2 border-white shadow-md flex items-center justify-center text-white"><span style="font-size:12px;font-family:sans-serif;font-weight:bold;">P</span></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

const dropoffIcon = L.divIcon({
  className: 'custom-leaflet-icon',
  html: `<div class="w-5 h-5 rounded-md bg-zinc-900 border-2 border-white shadow-md flex items-center justify-center text-white"><span style="font-size:10px;font-weight:bold;">D</span></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10]
});

const fuelIcon = L.divIcon({
  className: 'custom-leaflet-icon',
  html: `<div class="w-5 h-5 rounded-full bg-amber-500 border-2 border-white shadow-md flex items-center justify-center text-white"><span class="material-symbols-outlined" style="font-size:12px;">local_gas_station</span></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10]
});

// A small component to auto-fit the map bounds to the polyline coordinates
const FitBounds: React.FC<{ points: [number, number][] }> = ({ points }) => {
  const map = useMap();
  React.useEffect(() => {
    if (points && points.length > 0) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [points, map]);
  return null;
};

const RouteMap: React.FC = () => {
  const { routeData, currentLocation, dropoffLocation } = useTripStore();
  const [panelOpen, setPanelOpen] = useState(true);

  // Default Mock Trip (Chicago -> Detroit -> NY) coordinates and instructions if no route calculated
  const mockRoutePoints: [number, number][] = [
    [41.8781, -87.6298], // Chicago
    [42.3314, -83.0458], // Detroit
    [41.2033, -77.1945], // Bloomsburg (stopover)
    [40.7128, -74.0060]  // New York
  ];

  // Mock directions list based on mockup HTML
  const mockDirections = [
    {
      time: '08:00',
      type: 'start',
      title: 'Start Trip',
      location: currentLocation || 'Chicago Logistics Hub, IL',
      note: 'Driver pre-trip inspection complete.',
      timeLabel: '08:00'
    },
    {
      type: 'segment',
      road: 'I-94 E',
      distance: '280 mi',
      description: 'Continue on I-94 East towards Detroit.'
    },
    {
      time: '12:15',
      type: 'pickup',
      title: 'Pickup Load',
      location: 'Detroit Auto Parts, MI',
      tag: 'REQ',
      note: 'Gate 4, speak to Receiving.'
    },
    {
      time: '14:30',
      type: 'fuel',
      title: 'Fuel Stop',
      location: 'Flying J Travel Center, Toledo, OH',
      note: 'Scheduled fuel & HOS 30-min mandatory break.'
    },
    {
      type: 'segment',
      road: 'I-80 E',
      distance: '410 mi',
      description: 'Merge onto I-80 East via Ohio Turnpike.'
    },
    {
      time: '20:45',
      type: 'fuel',
      title: 'Rest & Fuel',
      location: 'Pilot Travel Center, Bloomsburg, PA',
      note: 'Scheduled overnight HOS rest period.'
    },
    {
      time: 'Est',
      type: 'dropoff',
      title: 'Dropoff',
      location: dropoffLocation || 'Queens Distribution Center, NY',
      note: 'Final delivery destination.'
    }
  ];

  // Map settings
  const hasCalculatedData = routeData && routeData.polyline && routeData.polyline.length > 0;
  
  // Format coordinate array for Leaflet (needs [lat, lng])
  const polylineCoordinates: [number, number][] = hasCalculatedData
    ? routeData.polyline.map(([lng, lat]: [number, number]) => [lat, lng])
    : mockRoutePoints;

  const startCoords = polylineCoordinates[0];
  const dropoffCoords = polylineCoordinates[polylineCoordinates.length - 1];
  
  // Find a middle point for pickup (either actual or mock)
  const pickupCoords = hasCalculatedData
    ? polylineCoordinates[Math.floor(polylineCoordinates.length / 3)] // approximate
    : mockRoutePoints[1];

  const fuelStops = hasCalculatedData
    ? (routeData.fuel_stop_positions || [])
    : [
        { lat: 41.6528, lng: -83.5379, label: 'Toledo, OH' },
        { lat: 41.0037, lng: -76.4511, label: 'Bloomsburg, PA' }
      ];

  const distanceMiles = hasCalculatedData ? routeData.distance_mi : 812.4;
  const durationHours = hasCalculatedData ? routeData.duration_hr : 14.76;

  return (
    <div className="flex-1 flex h-full w-full relative overflow-hidden">
      
      {/* Mobile panel toggle */}
      <button 
        onClick={() => setPanelOpen(!panelOpen)}
        className="md:hidden absolute top-md left-md z-30 bg-surface-container-lowest border border-border-subtle w-10 h-10 rounded-lg flex items-center justify-center text-text-primary shadow-md hover:bg-surface-container-low"
      >
        <Menu size={20} />
      </button>

      {/* Left Panel: Directions & Route summary */}
      <aside 
        className={`w-[380px] bg-surface-container-lowest border-r border-border-subtle h-full flex flex-col absolute md:relative z-20 shadow-lg md:shadow-none transition-transform duration-300 ${
          panelOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Panel Header */}
        <div className="p-lg border-b border-border-subtle bg-surface-bright sticky top-0 z-10 shrink-0">
          <div className="flex justify-between items-start mb-md">
            <div>
              <div className="flex items-center gap-xs mb-xs">
                <span className="px-sm py-[2px] bg-surface-container-high text-text-primary rounded text-[10px] font-bold uppercase tracking-wider">
                  Active Route
                </span>
                <span className="font-mono text-xs text-text-secondary">TRP-8924</span>
              </div>
              <h2 className="font-headline-md text-headline-sm text-on-surface">
                {currentLocation || 'Chicago'} → {dropoffLocation || 'New York'}
              </h2>
            </div>
          </div>
          
          {/* Summary stats */}
          <div className="grid grid-cols-2 gap-sm">
            <div className="bg-surface p-sm rounded-lg border border-border-subtle">
              <span className="font-label-md text-[10px] text-text-secondary block">Est. Drive Time</span>
              <span className="font-headline-sm text-sm text-[#2563EB]">{durationHours.toFixed(2)} hrs</span>
            </div>
            <div className="bg-surface p-sm rounded-lg border border-border-subtle">
              <span className="font-label-md text-[10px] text-text-secondary block">Total Distance</span>
              <span className="font-headline-sm text-sm text-on-surface">{distanceMiles.toFixed(1)} mi</span>
            </div>
          </div>
        </div>

        {/* Turn-by-Turn List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-md relative">
          <div className="absolute left-[39px] top-[30px] bottom-[30px] w-px bg-border-subtle"></div>
          
          {mockDirections.map((step, idx) => {
            if (step.type === 'segment') {
              return (
                <div key={idx} className="flex gap-md mb-md relative z-10 pl-[48px]">
                  <div className="flex-1 bg-surface border border-border-subtle rounded-lg p-sm">
                    <div className="flex items-center justify-between mb-xs">
                      <span className="font-label-md text-xs font-semibold text-[#2563EB]">{step.road}</span>
                      <span className="font-mono text-xs text-text-secondary">{step.distance}</span>
                    </div>
                    <p className="text-xs text-text-secondary">{step.description}</p>
                  </div>
                </div>
              );
            }

            // Node elements (Start, Pickup, Fuel, Dropoff)
            const iconMap: Record<string, React.ReactNode> = {
              start: <div className="w-2.5 h-2.5 rounded-full bg-blue-600"></div>,
              pickup: <Package size={12} className="text-white" />,
              fuel: <Fuel size={12} className="text-gray-500" />,
              dropoff: <div className="w-2 h-2 bg-zinc-900"></div>
            };

            const borderMap: Record<string, string> = {
              start: 'border-blue-600 bg-white',
              pickup: 'bg-blue-600 border-blue-600',
              fuel: 'bg-white border-zinc-400',
              dropoff: 'border-zinc-900 bg-white'
            };

            return (
              <div key={idx} className="flex gap-md mb-md relative z-10">
                <div className="w-12 text-right pt-xs">
                  <span className="font-mono text-[11px] text-text-secondary font-medium">{step.time || step.timeLabel}</span>
                </div>
                <div className="relative flex flex-col items-center justify-center shrink-0">
                  <div className={`w-6 h-6 rounded-full border flex items-center justify-center z-10 ${borderMap[step.type]}`}>
                    {iconMap[step.type]}
                  </div>
                </div>
                <div className="flex-1 pb-xs">
                  <div className="flex items-center gap-xs">
                    <h4 className="font-label-md text-xs font-bold text-on-surface">{step.title}</h4>
                    {step.tag && (
                      <span className="px-sm py-0.5 bg-secondary-container text-on-secondary-container rounded text-[9px] font-bold">{step.tag}</span>
                    )}
                  </div>
                  <p className="font-body-md text-xs text-text-secondary mt-xs">{step.location}</p>
                  {step.note && (
                    <div className="bg-surface-container-high rounded p-sm text-[11px] text-on-surface-variant flex items-center gap-xs mt-sm">
                      <Info size={12} className="shrink-0 text-text-secondary" />
                      <span>{step.note}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      {/* Right Canvas: Leaflet Map */}
      <div className="flex-1 h-full w-full relative z-10 bg-[#e5e3df]">
        <MapContainer 
          center={polylineCoordinates[Math.floor(polylineCoordinates.length / 2)]} 
          zoom={6} 
          className="w-full h-full"
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Fit map bounds dynamically to polyline */}
          <FitBounds points={polylineCoordinates} />
          
          {/* Route path polyline */}
          <Polyline 
            positions={polylineCoordinates} 
            color="#2563EB" 
            weight={4} 
            opacity={0.8}
            dashArray={hasCalculatedData ? undefined : "8, 6"}
          />

          {/* Start Marker */}
          <Marker position={startCoords} icon={startIcon}>
            <Popup>
              <div className="p-xs">
                <span className="font-bold text-xs block">Start Location</span>
                <span className="text-xs text-text-secondary">{currentLocation || 'Chicago'}</span>
              </div>
            </Popup>
          </Marker>

          {/* Pickup Marker */}
          {pickupCoords && (
            <Marker position={pickupCoords} icon={pickupIcon}>
              <Popup>
                <div className="p-xs">
                  <span className="font-bold text-xs block">Pickup Load</span>
                  <span className="text-xs text-text-secondary">Detroit Auto Parts, MI</span>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Fuel/Rest Stops */}
          {fuelStops.map((stop: any, idx: number) => (
            <Marker key={idx} position={[stop.lat, stop.lng]} icon={fuelIcon}>
              <Popup>
                <div className="p-xs">
                  <span className="font-bold text-xs block">Scheduled Fuel / Rest Stop</span>
                  <span className="text-xs text-text-secondary">{stop.label || `Fuel Stop ${idx + 1}`}</span>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Dropoff Marker */}
          <Marker position={dropoffCoords} icon={dropoffIcon}>
            <Popup>
              <div className="p-xs">
                <span className="font-bold text-xs block">Dropoff Point</span>
                <span className="text-xs text-text-secondary">{dropoffLocation || 'New York'}</span>
              </div>
            </Popup>
          </Marker>
        </MapContainer>

        {/* Floating Info Pill (Top Right) */}
        <div className="absolute top-md right-md z-20 bg-surface/90 backdrop-blur-sm border border-border-subtle px-md py-sm rounded-full shadow-md flex items-center gap-sm">
          <span className="font-mono text-xs font-semibold text-on-surface">{distanceMiles.toFixed(1)} mi</span>
          <div className="w-1 h-1 rounded-full bg-zinc-300"></div>
          <span className="font-mono text-xs font-semibold text-on-surface">{durationHours.toFixed(2)} hrs</span>
          <div className="w-1 h-1 rounded-full bg-zinc-300"></div>
          <div className="flex items-center gap-xs text-text-secondary">
            <Fuel size={14} />
            <span className="font-label-md text-xs">{fuelStops.length} stops</span>
          </div>
        </div>

        {/* Active Status Chip (Bottom Center) */}
        <div className="absolute bottom-md left-1/2 -translate-x-1/2 z-20 bg-surface border border-border-subtle px-md py-sm rounded-xl shadow-md flex items-center gap-md">
          <div className="flex items-center gap-sm">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="font-label-md text-xs font-bold text-on-surface">Unit 402 - On Route</span>
          </div>
          <div className="h-4 w-px bg-border-subtle"></div>
          <span className="font-mono text-xs text-text-secondary">65 mph</span>
        </div>
      </div>
    </div>
  );
};

export default RouteMap;
