import React, { Component } from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Accounts from './pages/Accounts';
import Transactions from './pages/Transactions';
import Budgets from './pages/Budgets';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import './App.css';

// Error boundary to catch React errors
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("React Error:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary p-4 m-4 bg-red-100 text-red-800 rounded-lg">
          <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
          <details className="whitespace-pre-wrap">
            <summary>Show error details</summary>
            <p className="mt-2">{this.state.error && this.state.error.toString()}</p>
            <p className="mt-2">{this.state.errorInfo && this.state.errorInfo.componentStack}</p>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

// Add a new ProtectedRoute component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  // If still loading, show loading indicator
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="p-4 text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Debug component to help diagnose issues
const DebugPage = () => {
  const [envVars, setEnvVars] = useState([]);
  
  useEffect(() => {
    // Collect all environment variables that start with VITE_
    const vars = Object.keys(import.meta.env)
      .filter(key => key.startsWith('VITE_'))
      .map(key => ({
        key,
        value: import.meta.env[key] ? `Set (${import.meta.env[key].length} chars)` : 'Not set'
      }));
    
    setEnvVars(vars);
  }, []);
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug Information</h1>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Environment Variables</h2>
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 p-2 text-left">Name</th>
              <th className="border border-gray-300 p-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {envVars.map(v => (
              <tr key={v.key}>
                <td className="border border-gray-300 p-2">{v.key}</td>
                <td className="border border-gray-300 p-2">{v.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Authentication Status</h2>
        <p>Authentication system ready: Yes</p>
      </div>
    </div>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-grow">
          <Routes>
            {/* Debug route */}
            <Route path="/debug" element={<DebugPage />} />
            
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            
            {/* Redirect root to dashboard if logged in, otherwise to login */}
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <Navigate to="/dashboard" replace />
                </ProtectedRoute>
              } 
            />
            
            {/* Protected routes */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/accounts" 
              element={
                <ProtectedRoute>
                  <Accounts />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/transactions" 
              element={
                <ProtectedRoute>
                  <Transactions />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/budgets" 
              element={
                <ProtectedRoute>
                  <Budgets />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/settings" 
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              } 
            />
            
            {/* Catch all - redirect to login */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
        <footer className="bg-gray-100 p-4 text-center text-gray-600 text-sm">
          &copy; {new Date().getFullYear()} WhiskeyLazy Finance. All rights reserved.
        </footer>
      </div>
    </ErrorBoundary>
  );
}

export default App; 