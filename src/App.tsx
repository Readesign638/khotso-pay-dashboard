import { useState } from 'react';
import Dashboard from './pages/Dashboard';
import LoginScreen from './pages/LoginScreen'; // Ensure you created this file!

export default function App() {
  // 1. Setup the Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // 2. The Gatekeeper: If not logged in, show Login only
  if (!isAuthenticated) {
    return <LoginScreen onLogin={() => setIsAuthenticated(true)} />;
  }

  // 3. The Dashboard: Only shows if isAuthenticated is true
  return (
    <div className="app-container">
      <Dashboard />
    </div>
  );
}