import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAccounts, removeAccount } from '../services/plaidService';
import PlaidLink from '../components/PlaidLink';
import { formatCurrency } from '../utils/formatters';
import { Link } from 'react-router-dom';

const ConnectedAccounts = () => {
  const { token, isAuthenticated, currentUser } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Group accounts by institution
  const accountsByInstitution = accounts.reduce((grouped, account) => {
    const inst = account.institution_name;
    if (!grouped[inst]) {
      grouped[inst] = [];
    }
    grouped[inst].push(account);
    return grouped;
  }, {});
  
  // Load accounts on mount and when refreshTrigger changes
  useEffect(() => {
    const loadAccounts = async () => {
      if (!isAuthenticated || !token) {
        setLoading(false);
        setError('Please log in to view your connected accounts.');
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await getAccounts(token);
        
        if (response.success) {
          setAccounts(response.accounts);
        } else {
          if (response.code === 'SESSION_EXPIRED') {
            setError('Your session has expired. Please try logging in again.');
          } else {
            setError(response.message || 'Failed to load accounts');
          }
          console.error('Account loading error:', response);
        }
      } catch (err) {
        setError('An unexpected error occurred');
        console.error('Account loading error:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadAccounts();
  }, [token, refreshTrigger, isAuthenticated]);
  
  // Handle successful Plaid Link connection
  const handlePlaidSuccess = (newAccounts) => {
    // Refresh accounts list
    setRefreshTrigger(prev => prev + 1);
  };
  
  // Handle Plaid Link exit
  const handlePlaidExit = (err) => {
    if (err) {
      setError('Connection process was exited: ' + (err.message || 'Unknown error'));
    }
  };
  
  // Handle account removal
  const handleRemoveAccount = async (accountId) => {
    if (window.confirm('Are you sure you want to remove this account?')) {
      setLoading(true);
      
      try {
        const response = await removeAccount(token, accountId);
        
        if (response.success) {
          // Remove account from state
          setAccounts(accounts.filter(acc => acc.id !== accountId));
        } else {
          setError(response.message || 'Failed to remove account');
        }
      } catch (err) {
        setError('An unexpected error occurred');
        console.error('Account removal error:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  // If not authenticated, show login reminder
  if (!isAuthenticated) {
    return (
      <div>
        <h1>Connected Accounts</h1>
        
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Please Log In</h3>
          <p style={{ color: 'var(--color-gray-500)', marginBottom: '1.5rem' }}>
            You need to be logged in to view and manage your connected accounts.
          </p>
          <Link to="/login" className="btn btn-primary">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }
  
  if (loading && accounts.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <p>Loading your connected accounts...</p>
      </div>
    );
  }
  
  return (
    <div>
      <h1>Connected Accounts</h1>
      
      <div className="card" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>Add a New Account</h2>
        <p style={{ marginBottom: '1.5rem', color: 'var(--color-gray-500)' }}>
          Connect your bank accounts securely using Plaid to automatically import transactions and track your finances.
        </p>
        
        <PlaidLink 
          onSuccess={handlePlaidSuccess} 
          onExit={handlePlaidExit}
          buttonText="+ Connect a Bank Account"
        />
        
        {error && (
          <div style={{ 
            marginTop: '1rem', 
            padding: '0.75rem', 
            backgroundColor: 'rgba(239, 68, 68, 0.1)', 
            color: 'var(--color-danger)',
            borderRadius: 'var(--radius-md)'
          }}>
            {error}
            {error.includes('session') && (
              <div style={{ marginTop: '0.5rem' }}>
                <Link to="/login" className="btn btn-sm btn-danger">
                  Go to Login
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Connected Accounts List */}
      {Object.keys(accountsByInstitution).length > 0 ? (
        <div>
          {Object.entries(accountsByInstitution).map(([institution, institutionAccounts]) => (
            <div key={institution} className="card" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
              <h2 style={{ marginBottom: '1rem' }}>{institution}</h2>
              
              {institutionAccounts.map(account => (
                <div 
                  key={account.id} 
                  style={{ 
                    padding: '1rem',
                    marginBottom: '0.75rem',
                    border: '1px solid var(--color-gray-200)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
                      {account.name}
                    </div>
                    <div style={{ color: 'var(--color-gray-500)', fontSize: '0.875rem' }}>
                      {account.mask ? '••••' + account.mask : 'No account number available'}
                    </div>
                    <div style={{ 
                      display: 'inline-block',
                      marginTop: '0.5rem',
                      padding: '0.25rem 0.5rem',
                      backgroundColor: 'var(--color-gray-100)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.75rem',
                      textTransform: 'capitalize'
                    }}>
                      {account.type} {account.subtype ? `• ${account.subtype}` : ''}
                    </div>
                  </div>
                  
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ 
                      fontWeight: 'bold', 
                      fontSize: '1.25rem',
                      color: account.balances.available >= 0 
                        ? 'var(--color-success)' 
                        : 'var(--color-danger)',
                      marginBottom: '0.25rem'
                    }}>
                      {formatCurrency(account.balances.current)}
                    </div>
                    <div style={{ color: 'var(--color-gray-500)', fontSize: '0.75rem' }}>
                      Available: {formatCurrency(account.balances.available || 0)}
                    </div>
                    <button 
                      className="btn btn-sm btn-outline btn-danger"
                      style={{ marginTop: '0.5rem' }}
                      onClick={() => handleRemoveAccount(account.id)}
                    >
                      Disconnect
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>No Connected Accounts</h3>
          <p style={{ color: 'var(--color-gray-500)', marginBottom: '1.5rem' }}>
            Connect your first bank account to get started tracking your finances.
          </p>
        </div>
      )}
    </div>
  );
};

export default ConnectedAccounts; 