import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { useAuth } from '../context/AuthContext';
import supabase from '../lib/supabase';

const Login = () => {
  const { isAuthenticated, loading, login } = useAuth();
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  useEffect(() => {
    // Redirect to the requested page if the user is already authenticated
    if (isAuthenticated && !loading) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, loading, navigate, from]);

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

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="m-auto w-full max-w-md p-8 bg-white rounded-lg shadow-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-blue-600">WhiskeyLazy Finance</h1>
          <p className="mt-2 text-gray-600">Sign in or create an account to manage your finances</p>
        </div>

        {!isAuthenticated && (
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#3B82F6', // blue-500
                    brandAccent: '#2563EB', // blue-600
                  },
                },
              },
            }}
            providers={['google', 'github']}
            redirectTo={`${window.location.origin}/dashboard`}
            socialLayout="horizontal"
            skipEmailConfirmation={true}
            emailRedirectTo={`${window.location.origin}/dashboard`}
          />
        )}
      </div>
    </div>
  );
};

export default Login; 