import React from 'react';
import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import TripPlanner from './pages/TripPlanner';
import RouteMap from './pages/RouteMap';
import Compliance from './pages/Compliance';
import TripHistory from './pages/TripHistory';
import { AuthPage } from './pages/AuthPages';
import { useTripStore } from './store';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useTripStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
};

function App() {
  const { loadUserFromStorage } = useTripStore();

  React.useEffect(() => {
    loadUserFromStorage();
  }, [loadUserFromStorage]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/signup" element={<AuthPage mode="signup" />} />
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/planner" element={<ProtectedRoute><TripPlanner /></ProtectedRoute>} />
        <Route path="/map" element={<ProtectedRoute><RouteMap /></ProtectedRoute>} />
        <Route path="/compliance" element={<ProtectedRoute><Compliance /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><TripHistory /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
