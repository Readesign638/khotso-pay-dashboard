import { useState } from 'react';
import { SpeedInsights } from "@vercel/speed-insights/react"; // 1. Add the import
import Dashboard from './pages/Dashboard';
import LoginScreen from './pages/LoginScreen'; 

export default function App() {
  // 1. Setup the Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // 2. The Gatekeeper: If not logged in, show Login only
  if (!isAuthenticated) {
    return (
      <>
        <LoginScreen onLogin={() => setIsAuthenticated(true)} />
        <SpeedInsights /> {/* Tracks Login Performance */}
      </>
    );
  }

  // 3. The Dashboard: Only shows if isAuthenticated is true
  return (
    <div className="app-container">
      <Dashboard />
      <SpeedInsights /> {/* Tracks Dashboard Performance */}
    </div>
  );
}