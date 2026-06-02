
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import TripPlanner from './pages/TripPlanner';
import RouteMap from './pages/RouteMap';
import Compliance from './pages/Compliance';
import TripHistory from './pages/TripHistory';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout><Dashboard /></Layout>} />
        <Route path="/planner" element={<Layout><TripPlanner /></Layout>} />
        <Route path="/map" element={<Layout><RouteMap /></Layout>} />
        <Route path="/compliance" element={<Layout><Compliance /></Layout>} />
        <Route path="/history" element={<Layout><TripHistory /></Layout>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
