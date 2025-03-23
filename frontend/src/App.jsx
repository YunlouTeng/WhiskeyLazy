import React from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Import pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Accounts from './pages/Accounts';
import Transactions from './pages/Transactions';
import Settings from './pages/Settings';
import ConnectedAccounts from './pages/ConnectedAccounts';
import TestPlaid from './pages/TestPlaid';

// Simple placeholder components
const NotFound = () => (
  <div className="card" style={{ textAlign: 'center' }}>
    <h2 style={{ fontSize: '2rem', color: 'var(--color-danger)' }}>404</h2>
    <p>Page not found!</p>
    <Link to="/" className="btn btn-primary" style={{ marginTop: '1rem' }}>
      Go Home
    </Link>
  </div>
);

// Navigation component
const Navigation = () => {
  const location = useLocation();
  const { isAuthenticated, currentUser, logout } = useAuth();
  
  return (
    <nav className="nav">
      <div className="nav-container container">
        <div className="nav-logo">WhiskeyLazy(亲友测试版)</div>
        <div className="nav-links">
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
            Dashboard
          </Link>
          <Link to="/accounts" className={`nav-link ${location.pathname === '/accounts' ? 'active' : ''}`}>
            Accounts
          </Link>
          <Link to="/connected-accounts" className={`nav-link ${location.pathname === '/connected-accounts' ? 'active' : ''}`}>
            Connect Banks
          </Link>
          <Link to="/transactions" className={`nav-link ${location.pathname === '/transactions' ? 'active' : ''}`}>
            Transactions
          </Link>
          <Link to="/settings" className={`nav-link ${location.pathname === '/settings' ? 'active' : ''}`}>
            Settings
          </Link>
          
          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', marginLeft: '1rem' }}>
              <span style={{ marginRight: '1rem' }}>
                Hello, {currentUser?.name || 'User'}
              </span>
              <button onClick={logout} className="btn btn-outline">
                Logout
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn btn-primary" style={{ marginLeft: '1rem' }}>
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

// Create a protected route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  // If still loading, show nothing (or could show a spinner)
  if (loading) {
    return <div className="container" style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;
  }
  
  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  // If authenticated, render the children
  return children;
};

// Layout component
const Layout = ({ children }) => {
  return (
    <div>
      <Navigation />
      <main className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
        {children}
      </main>
      <footer style={{ textAlign: 'center', padding: '1rem', borderTop: '1px solid var(--color-gray-200)' }}>
        <div className="container">
          <p>&copy; {new Date().getFullYear()} WhiskeyLazy. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      <Route path="/" element={
        <ProtectedRoute>
          <Layout>
            <Dashboard />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/accounts" element={
        <ProtectedRoute>
          <Layout>
            <Accounts />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/connected-accounts" element={
        <ProtectedRoute>
          <Layout>
            <ConnectedAccounts />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/transactions" element={
        <ProtectedRoute>
          <Layout>
            <Transactions />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/settings" element={
        <ProtectedRoute>
          <Layout>
            <Settings />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/test-plaid" element={
        <ProtectedRoute>
          <Layout>
            <TestPlaid />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="*" element={
        <Layout>
          <NotFound />
        </Layout>
      } />
    </Routes>
  );
}

export default App; 