import { create } from 'zustand';

interface TripState {
  currentLocation: string;
  pickupLocation: string;
  dropoffLocation: string;
  cycleUsed: number;
  isDrawerOpen: boolean;
  
  routeData: any;
  complianceData: any;
  eldLogs: any[];
  isLoading: boolean;
  
  setCurrentLocation: (loc: string) => void;
  setPickupLocation: (loc: string) => void;
  setDropoffLocation: (loc: string) => void;
  setCycleUsed: (val: number) => void;
  setDrawerOpen: (isOpen: boolean) => void;
  
  calculateTrip: () => Promise<void>;
}

export const useTripStore = create<TripState>((set, get) => ({
  currentLocation: 'Chicago, IL',
  pickupLocation: 'Detroit, MI',
  dropoffLocation: 'New York, NY',
  cycleUsed: 24.5,
  isDrawerOpen: false,
  
  routeData: null,
  complianceData: null,
  eldLogs: [],
  isLoading: false,
  
  setCurrentLocation: (loc) => set({ currentLocation: loc }),
  setPickupLocation: (loc) => set({ pickupLocation: loc }),
  setDropoffLocation: (loc) => set({ dropoffLocation: loc }),
  setCycleUsed: (val) => set({ cycleUsed: val }),
  setDrawerOpen: (isOpen) => set({ isDrawerOpen: isOpen }),
  
  calculateTrip: async () => {
    set({ isLoading: true });
    try {
      const { currentLocation, pickupLocation, dropoffLocation, cycleUsed } = get();
      const response = await fetch('http://localhost:8000/api/trips/calculate/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_location: currentLocation,
          pickup_location: pickupLocation,
          dropoff_location: dropoffLocation,
          current_cycle_used: cycleUsed
        })
      });
      const data = await response.json();
      set({ 
        routeData: data.route, 
        complianceData: data.compliance, 
        eldLogs: data.eld_logs,
        isLoading: false
      });
    } catch (error) {
      console.error(error);
      set({ isLoading: false });
    }
  }
}));
