import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { isAuthenticated, currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="bg-blue-600 text-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Link to="/" className="font-bold text-xl tracking-tight">
            WhiskeyLazy Finance
          </Link>
        </div>
        
        <div className="flex space-x-4 items-center">
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className="hover:text-blue-200 transition-colors">
                Dashboard
              </Link>
              <Link to="/accounts" className="hover:text-blue-200 transition-colors">
                Accounts
              </Link>
              <Link to="/transactions" className="hover:text-blue-200 transition-colors">
                Transactions
              </Link>
              <Link to="/budgets" className="hover:text-blue-200 transition-colors">
                Budgets
              </Link>
              <div className="relative group">
                <button className="flex items-center hover:text-blue-200 transition-colors">
                  <span className="mr-1">{currentUser?.email?.split('@')[0] || 'User'}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg overflow-hidden z-10 hidden group-hover:block">
                  <div className="py-1">
                    <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Profile</Link>
                    <Link to="/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Settings</Link>
                    <button onClick={handleSignOut} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      Sign out
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-blue-200 transition-colors">
                Login
              </Link>
              <Link to="/login" className="bg-white text-blue-600 hover:bg-blue-100 px-4 py-2 rounded-lg font-medium transition-colors">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 