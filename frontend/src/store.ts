import { create } from 'zustand';

const API_BASE = 'http://localhost:8000/api';

export interface TripHistoryItem {
  trip_id: string;
  current_location: string;
  pickup_location: string;
  dropoff_location: string;
  total_distance_miles: number;
  total_duration_hours: number;
  is_compliant: boolean;
  violation_reasons: string[];
  days_required: number;
  created_at: string | null;
  has_eld_logs: boolean;
  eld_log_count: number;
}

export interface User {
  id: string;
  email: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
  loadUserFromStorage: () => Promise<void>;
}

interface TripState extends AuthState {
  // Trip form inputs
  currentLocation: string;
  pickupLocation: string;
  dropoffLocation: string;
  cycleUsed: number;
  driverName: string;

  // UI state
  isDrawerOpen: boolean;

  // Current trip results
  tripId: string | null;
  routeData: any;
  complianceData: any;
  eldLogs: any[];
  isLoading: boolean;
  error: string | null;

  // Trip history
  tripHistory: TripHistoryItem[];
  historyLoading: boolean;
  historyError: string | null;
  historyPage: number;
  historyTotalPages: number;

  // Actions - trip inputs
  setCurrentLocation: (loc: string) => void;
  setPickupLocation: (loc: string) => void;
  setDropoffLocation: (loc: string) => void;
  setCycleUsed: (val: number) => void;
  setDriverName: (name: string) => void;
  setDrawerOpen: (isOpen: boolean) => void;

  // Actions - API calls
  calculateTrip: () => Promise<void>;
  loadTripHistory: (page?: number) => Promise<void>;
  loadTripById: (tripId: string) => Promise<void>;

  // Computed helpers
  getTripContextForChat: () => Record<string, any> | null;
}

export const useTripStore = create<TripState>((set, get) => ({
  // --- Auth State ---
  token: null,
  user: null,
  isAuthenticated: false,
  
  setAuth: (token: string, user: User) => {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_user', JSON.stringify(user));
    set({ token, user, isAuthenticated: true });
  },
  
  logout: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    set({ 
      token: null, 
      user: null, 
      isAuthenticated: false,
      // Clear data on logout
      tripHistory: [],
      tripId: null,
      routeData: null,
      complianceData: null,
      eldLogs: []
    });
  },
  
  loadUserFromStorage: async () => {
    const token = localStorage.getItem('auth_token');
    const userStr = localStorage.getItem('auth_user');
    if (token && userStr) {
      try {
        const parsedUser = JSON.parse(userStr);
        set({ token, user: parsedUser, isAuthenticated: true });
        
        // Asynchronously verify token with the backend to catch stale sessions
        const response = await fetch(`${API_BASE}/users/me/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
          get().logout();
        }
      } catch (e) {
        get().logout();
      }
    }
  },

  // --- State ---
  currentLocation: 'Chicago, IL',
  pickupLocation: 'Detroit, MI',
  dropoffLocation: 'New York, NY',
  cycleUsed: 24.5,
  driverName: 'John Doe',
  isDrawerOpen: false,

  tripId: null,
  routeData: null,
  complianceData: null,
  eldLogs: [],
  isLoading: false,
  error: null,

  tripHistory: [],
  historyLoading: false,
  historyError: null,
  historyPage: 1,
  historyTotalPages: 1,

  // --- Setters ---
  setCurrentLocation: (loc) => set({ currentLocation: loc }),
  setPickupLocation: (loc) => set({ pickupLocation: loc }),
  setDropoffLocation: (loc) => set({ dropoffLocation: loc }),
  setCycleUsed: (val) => set({ cycleUsed: val }),
  setDriverName: (name) => set({ driverName: name }),
  setDrawerOpen: (isOpen) => set({ isDrawerOpen: isOpen }),

  // --- Calculate Trip ---
  calculateTrip: async () => {
    const { currentLocation, pickupLocation, dropoffLocation, cycleUsed, driverName, token } = get();
    if (!token) return;

    set({ isLoading: true, error: null });

    try {
      const response = await fetch(`${API_BASE}/trips/calculate/`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          current_location: currentLocation,
          pickup_location: pickupLocation,
          dropoff_location: dropoffLocation,
          current_cycle_used: cycleUsed,
          driver_name: driverName,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) get().logout();
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();
      set({
        tripId: data.trip_id,
        routeData: data.route,
        complianceData: data.compliance,
        eldLogs: data.eld_logs || [],
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      console.error('Trip calculation failed:', error);
      set({
        isLoading: false,
        error: error.message || 'Failed to connect to backend.',
      });
    }
  },

  // --- Load Trip History ---
  loadTripHistory: async (page = 1) => {
    const { token } = get();
    if (!token) return;

    set({ historyLoading: true, historyError: null });
    try {
      const response = await fetch(`${API_BASE}/trips/list/?page=${page}&page_size=10`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        if (response.status === 401) get().logout();
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      set({
        tripHistory: data.trips || [],
        historyPage: data.page || 1,
        historyTotalPages: data.total_pages || 1,
        historyLoading: false,
        historyError: null,
      });
    } catch (error: any) {
      console.error('Failed to load trip history:', error);
      set({
        historyLoading: false,
        historyError: error.message || 'Failed to load trip history.',
      });
    }
  },

  // --- Load a specific trip by ID ---
  loadTripById: async (tripId: string) => {
    const { token } = get();
    if (!token) return;

    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_BASE}/trips/${tripId}/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        if (response.status === 401) get().logout();
        throw new Error(`Trip not found`);
      }

      const data = await response.json();
      set({
        tripId: data.trip_id,
        currentLocation: data.current_location,
        pickupLocation: data.pickup_location,
        dropoffLocation: data.dropoff_location,
        cycleUsed: data.current_cycle_used || 0,
        routeData: data.route,
        complianceData: data.compliance,
        eldLogs: data.eld_logs || [],
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      console.error('Failed to load trip:', error);
      set({ isLoading: false, error: error.message });
    }
  },

  // --- Build trip context for AI chat ---
  getTripContextForChat: () => {
    const { routeData, complianceData, currentLocation, dropoffLocation } = get();
    if (!routeData || !complianceData) return null;
    return {
      from: currentLocation,
      to: dropoffLocation,
      distance_mi: routeData.distance_mi,
      duration_hr: routeData.duration_hr,
      is_compliant: complianceData.is_compliant,
      violations: complianceData.violations || [],
      days_required: complianceData.days_required,
      remaining_cycle_hours: complianceData.remaining_cycle_hours,
    };
  },
}));
