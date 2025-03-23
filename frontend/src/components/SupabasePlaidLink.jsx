import React, { useState, useCallback, useEffect } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import { useSupabaseAuth } from '../lib/supabaseHooks.jsx';
import supabase from '../lib/supabase';
import { usePlaidTokens } from '../lib/supabaseHooks.jsx';

/**
 * Plaid Link component that integrates with Supabase
 */
const SupabasePlaidLink = ({ 
  onSuccess, 
  onExit, 
  buttonText = "Connect a bank account", 
  className = "btn btn-primary"
}) => {
  const [linkToken, setLinkToken] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState('');
  const { storeToken } = usePlaidTokens();

  // Get a link token when component mounts
  useEffect(() => {
    const createLinkToken = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // First check if the user is authenticated
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          setError('You must be logged in to connect a bank account');
          return;
        }
        
        // Call our serverless function to create a link token
        const response = await fetch('/api/plaid/create-link-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          }
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to create link token');
        }
        
        const data = await response.json();
        
        if (!data.link_token) {
          throw new Error('No link token returned from API');
        }
        
        setLinkToken(data.link_token);
        setDebugInfo(`Link token received: ${data.link_token.slice(0, 10)}...`);
      } catch (err) {
        setError(err.message || 'An unexpected error occurred');
        setDebugInfo(`Error: ${err.message}`);
        console.error('Error creating link token:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    createLinkToken();
  }, []);

  // Handle success - exchange public token for access token
  const handleSuccess = useCallback(async (publicToken, metadata) => {
    setIsLoading(true);
    setError(null);
    setDebugInfo('Processing connection...');
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('User authentication required');
      }
      
      // Exchange the public token for an access token
      const response = await fetch('/api/plaid/exchange-public-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          public_token: publicToken,
          institution: metadata?.institution,
          accounts: metadata?.accounts
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to exchange token');
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Token exchange failed');
      }
      
      // Store the Plaid tokens in Supabase
      if (data.accessToken && data.itemId) {
        const institutionName = metadata?.institution?.name || 'Unknown Institution';
        
        const storageResult = await storeToken(
          data.accessToken, 
          data.itemId, 
          institutionName
        );
        
        if (!storageResult.success) {
          throw new Error(storageResult.error || 'Failed to store Plaid token');
        }
      }
      
      setDebugInfo('Connection successful');
      
      // Notify parent component of success
      if (onSuccess) {
        onSuccess(data.accounts);
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred');
      setDebugInfo(`Error: ${err.message}`);
      console.error('Error processing Plaid connection:', err);
    } finally {
      setIsLoading(false);
    }
  }, [onSuccess, storeToken]);

  // Handle exit from Plaid Link
  const handleExit = useCallback((err) => {
    if (err) {
      console.error('Plaid Link exit with error:', err);
      setDebugInfo(`Exit error: ${err.message || JSON.stringify(err)}`);
    } else {
      setDebugInfo('User exited Plaid Link');
    }
    
    if (onExit) {
      onExit(err);
    }
  }, [onExit]);

  // Plaid Link configuration
  const config = {
    token: linkToken,
    onSuccess: handleSuccess,
    onExit: handleExit,
  };

  // Initialize Plaid Link
  const { open, ready } = usePlaidLink(config);

  // Function to handle button click directly
  const handleButtonClick = () => {
    if (ready && linkToken) {
      setDebugInfo('Opening Plaid Link...');
      open();
    } else {
      setDebugInfo(`Not ready. Ready: ${ready}, Token: ${linkToken ? 'exists' : 'missing'}`);
    }
  };

  // Check if user is authenticated
  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return false;
    }
    return true;
  };

  return (
    <div>
      <button 
        onClick={handleButtonClick} 
        disabled={!ready || isLoading || !linkToken} 
        className={className}
        style={{ position: 'relative' }}
      >
        {isLoading ? (
          <span>Loading...</span>
        ) : (
          <span>{buttonText}</span>
        )}
      </button>
      
      {error && (
        <div style={{ color: 'var(--color-danger)', marginTop: '0.5rem', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}
      
      <div style={{ color: 'gray', marginTop: '0.5rem', fontSize: '0.75rem' }}>
        Debug: {debugInfo}
      </div>
    </div>
  );
};

export default SupabasePlaidLink; 