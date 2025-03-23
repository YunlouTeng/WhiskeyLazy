import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { isAuthenticated, currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await logout();
    navigate('/login');
  };

  // Check if the current route matches the provided path
  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo and brand */}
          <Link to="/" className="flex items-center text-indigo-600 font-bold text-xl">
            WhiskeyLazy<span className="text-gray-500">(亲友测试版)</span>
          </Link>
          
          {/* Nav links */}
          {isAuthenticated && (
            <div className="hidden md:flex space-x-6">
              <Link 
                to="/dashboard" 
                className={`h-16 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActive('/dashboard') 
                    ? 'border-indigo-500 text-gray-900' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Dashboard
              </Link>
              <Link 
                to="/accounts" 
                className={`h-16 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActive('/accounts') 
                    ? 'border-indigo-500 text-gray-900' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Accounts
              </Link>
              <Link 
                to="/connect" 
                className={`h-16 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActive('/connect') 
                    ? 'border-indigo-500 text-gray-900' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Connect Banks
              </Link>
              <Link 
                to="/transactions" 
                className={`h-16 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActive('/transactions') 
                    ? 'border-indigo-500 text-gray-900' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Transactions
              </Link>
              <Link 
                to="/settings" 
                className={`h-16 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActive('/settings') 
                    ? 'border-indigo-500 text-gray-900' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Settings
              </Link>
            </div>
          )}
          
          {/* User menu */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <span className="text-gray-700">Hello, {currentUser?.user_metadata?.full_name || currentUser?.email?.split('@')[0] || 'Demo User'}</span>
                <button 
                  onClick={handleSignOut}
                  className="inline-block bg-white hover:bg-gray-100 text-gray-800 font-medium py-1 px-4 border border-gray-300 rounded"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-600 hover:text-gray-900">
                  Sign In
                </Link>
                <Link 
                  to="/login" 
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 