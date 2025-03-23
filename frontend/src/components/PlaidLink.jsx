import React, { useState, useCallback, useEffect } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import { useAuth } from '../context/AuthContext';
import { createLinkToken, exchangePublicToken } from '../services/plaidService';

/**
 * PlaidLink Button Component
 * Renders a button to open Plaid Link and connect bank accounts
 * 
 * @param {Object} props
 * @param {Function} props.onSuccess - Callback function when accounts are successfully connected
 * @param {Function} props.onExit - Callback function when user exits Plaid Link
 * @param {string} props.buttonText - Text to display on the button
 * @param {string} props.className - CSS class for styling the button
 */
const PlaidLink = ({ 
  onSuccess, 
  onExit, 
  buttonText = "Connect a bank account", 
  className = "btn btn-primary"
}) => {
  const { token, isAuthenticated } = useAuth();
  const [linkToken, setLinkToken] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isDev, setIsDev] = useState(process.env.NODE_ENV === 'development');
  const [debugInfo, setDebugInfo] = useState('');

  // Get a link token from the server when component mounts
  useEffect(() => {
    const getLinkToken = async () => {
      if (!isAuthenticated) {
        setError('You must be logged in to connect a bank account.');
        setDebugInfo('Not authenticated');
        return;
      }

      setIsLoading(true);
      setError(null);
      setDebugInfo('Requesting link token...');
      
      try {
        console.log('Requesting link token with auth token:', token ? 'token exists' : 'no token');
        const response = await createLinkToken(token);
        console.log('Link token response:', response);
        
        if (response.success) {
          setLinkToken(response.linkToken);
          setDebugInfo(`Link token received: ${response.linkToken.slice(0, 10)}...`);
        } else {
          setError(response.message || 'Failed to create link token');
          setDebugInfo(`Error: ${response.message || 'Unknown error'}`);
          console.error('Link token error:', response);
        }
      } catch (err) {
        setError('An unexpected error occurred');
        setDebugInfo(`Exception: ${err.message}`);
        console.error('Link token error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    getLinkToken();
  }, [token, isAuthenticated]);

  // Handle success - exchange public token for access token
  const handleSuccess = useCallback(async (publicToken, metadata) => {
    setIsLoading(true);
    setError(null);
    setDebugInfo('Exchanging public token...');
    
    try {
      console.log('Exchanging public token with metadata:', metadata);
      const response = await exchangePublicToken(token, publicToken, metadata);
      
      if (response.success) {
        setDebugInfo('Token exchange successful');
        // Notify parent of success
        if (onSuccess) {
          onSuccess(response.accounts);
        }
      } else {
        setError(response.message || 'Failed to exchange token');
        setDebugInfo(`Exchange error: ${response.message}`);
        console.error('Token exchange error:', response);
      }
    } catch (err) {
      setError('An unexpected error occurred');
      setDebugInfo(`Exchange exception: ${err.message}`);
      console.error('Token exchange error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [token, onSuccess]);

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

  // Mock function for development testing when backend is not available
  const handleDevClick = useCallback(() => {
    if (isDev) {
      console.log('Development mode: Simulating successful account connection');
      setDebugInfo('Using mock data in dev mode');
      
      // Mock account data
      const mockAccounts = [
        {
          id: 'mock-account-' + Date.now(),
          name: 'Mock Checking Account',
          mask: '1234',
          type: 'depository',
          subtype: 'checking',
          institution_name: 'Mock Bank',
          balances: {
            available: 1234.56,
            current: 1234.56
          }
        },
        {
          id: 'mock-account-savings-' + Date.now(),
          name: 'Mock Savings Account',
          mask: '5678',
          type: 'depository',
          subtype: 'savings',
          institution_name: 'Mock Bank',
          balances: {
            available: 5678.90,
            current: 5678.90
          }
        },
        {
          id: 'mock-account-credit-' + Date.now(),
          name: 'Mock Credit Card',
          mask: '9012',
          type: 'credit',
          subtype: 'credit card',
          institution_name: 'Mock Credit Union',
          balances: {
            available: 2000.00,
            current: -450.75
          }
        }
      ];
      
      if (onSuccess) {
        onSuccess(mockAccounts);
      }
    }
  }, [isDev, onSuccess]);

  // Plaid Link configuration
  const config = {
    token: linkToken,
    onSuccess: (public_token, metadata) => handleSuccess(public_token, metadata),
    onExit: (err, metadata) => handleExit(err, metadata),
  };

  // Initialize Plaid Link
  const { open, ready } = usePlaidLink(config);

  // Function to handle button click directly
  const handleButtonClick = () => {
    console.log('Button clicked, Plaid Link ready:', ready);
    console.log('Link token:', linkToken);
    
    if (ready && linkToken) {
      console.log('Opening Plaid Link...');
      setDebugInfo('Opening Plaid Link...');
      open();
    } else {
      console.log('Plaid Link not ready or no link token');
      setDebugInfo(`Not ready. Ready: ${ready}, Token: ${linkToken ? 'exists' : 'missing'}`);
    }
  };

  // If not authenticated, show a login reminder button
  if (!isAuthenticated) {
    return (
      <div>
        <button 
          disabled={true}
          className={className}
          style={{ position: 'relative', opacity: 0.7 }}
        >
          <span>{buttonText}</span>
        </button>
        
        <div style={{ color: 'var(--color-danger)', marginTop: '0.5rem', fontSize: '0.875rem' }}>
          Please log in to connect your accounts
        </div>
      </div>
    );
  }

  // If backend connection fails in development mode, show a button that will mock the behavior
  if (isDev && error && error.includes('Network error')) {
    return (
      <div>
        <button 
          onClick={handleDevClick} 
          className={className}
          style={{ position: 'relative' }}
        >
          {buttonText} (Dev Mode)
        </button>
        
        <div style={{ color: 'orange', marginTop: '0.5rem', fontSize: '0.875rem' }}>
          Running in development mode with mock data. Backend connection failed.
        </div>
        <div style={{ color: 'gray', marginTop: '0.5rem', fontSize: '0.75rem' }}>
          Debug: {debugInfo}
        </div>
      </div>
    );
  }

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

export default PlaidLink; 