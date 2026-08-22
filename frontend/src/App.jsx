import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProjectProvider } from './contexts/ProjectContext';
import { ToastProvider } from './contexts/ToastContext';
import { Zap } from 'lucide-react';

// Layout
import AppLayout from './components/layout/AppLayout';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import ForecastPage from './pages/ForecastPage';
import EnergyFlowPage from './pages/EnergyFlowPage';
import AlertsPage from './pages/AlertsPage';
import CopilotPage from './pages/CopilotPage';
import SimulatorPage from './pages/SimulatorPage';
import UploadPage from './pages/UploadPage';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  // Show a polished loading screen while verifying stored token
  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-bg-space gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-2 border-energy-cyan/20 animate-spin border-t-energy-cyan" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Zap size={20} className="text-energy-cyan" />
          </div>
        </div>
        <p className="text-slate-400 text-sm">Initializing ENER SAGE AI...</p>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!user) return <Navigate to="/login" replace />;

  return children;
};

// Redirect already-logged-in users away from auth pages
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

      <Route element={<ProtectedRoute><ProjectProvider><AppLayout /></ProjectProvider></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/forecast" element={<ForecastPage />} />
        <Route path="/energy-flow" element={<EnergyFlowPage />} />
        <Route path="/alerts" element={<AlertsPage />} />
        <Route path="/copilot" element={<CopilotPage />} />
        <Route path="/simulator" element={<SimulatorPage />} />
        <Route path="/upload" element={<UploadPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
