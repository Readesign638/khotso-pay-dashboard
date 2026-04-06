import { useState } from 'react';
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Analytics } from "@vercel/analytics/react"; // Use /react here!
import Dashboard from './pages/Dashboard';
import LoginScreen from './pages/LoginScreen'; 

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  if (!isAuthenticated) {
    return (
      <>
        <LoginScreen onLogin={() => setIsAuthenticated(true)} />
        <SpeedInsights />
        <Analytics /> {/* Tracks Login page views */}
      </>
    );
  }

  return (
    <div className="app-container">
      <Dashboard />
      <SpeedInsights />
      <Analytics /> {/* Tracks Dashboard interaction */}
    </div>
  );
}