import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/formatters';
import { getAccounts } from '../services/plaidService';
import PlaidLink from '../components/PlaidLink';

// Helper functions
const formatDate = (dateString) => {
  const options = { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric' };
  return new Date(dateString).toLocaleString('en-US', options);
};

const AccountTypeIcon = ({ type }) => {
  let iconClass = '';
  let bgColor = '';
  
  switch(type) {
    case 'checking':
    case 'depository':
      iconClass = '💳';
      bgColor = 'var(--color-primary-light)';
      break;
    case 'savings':
      iconClass = '💰';
      bgColor = 'var(--color-success-light)';
      break;
    case 'credit':
      iconClass = '💵';
      bgColor = 'var(--color-danger-light)';
      break;
    case 'investment':
    case 'brokerage':
      iconClass = '📈';
      bgColor = 'var(--color-warning-light)';
      break;
    case 'loan':
    case 'mortgage':
      iconClass = '🏠';
      bgColor = 'var(--color-secondary-light)';
      break;
    default:
      iconClass = '🏦';
      bgColor = 'var(--color-gray-300)';
  }
  
  return (
    <div style={{
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      backgroundColor: bgColor,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '1.25rem'
    }}>
      {iconClass}
    </div>
  );
};

const AccountCard = ({ account, onSelect }) => {
  // For Plaid accounts, the structure is different
  const balance = account.balances ? account.balances.current : account.balance;
  const accountType = account.type || (account.subtype ? account.subtype : 'unknown');
  const institutionName = account.institution_name || account.institution;
  
  return (
    <div className="card" style={{ margin: '0.5rem 0', padding: '1rem', cursor: 'pointer' }} onClick={() => onSelect(account)}>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <AccountTypeIcon type={accountType} />
        <div style={{ flex: 1 }}>
          <h3 style={{ marginBottom: '0.25rem' }}>{account.name}</h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-gray-500)' }}>{institutionName}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ 
            fontWeight: 'bold', 
            fontSize: '1.25rem',
            color: balance >= 0 ? 'var(--color-success)' : 'var(--color-danger)'
          }}>
            {formatCurrency(balance)}
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)', textTransform: 'capitalize' }}>
            {accountType}
          </p>
        </div>
      </div>
    </div>
  );
};

const AccountDetailModal = ({ account, onClose }) => {
  if (!account) return null;
  
  // For Plaid accounts, the structure is different
  const balance = account.balances ? account.balances.current : account.balance;
  const available = account.balances ? account.balances.available : balance;
  const accountType = account.type || (account.subtype ? account.subtype : 'unknown');
  const institutionName = account.institution_name || account.institution;
  const accountNumber = account.mask ? `xxxx${account.mask}` : account.accountNumber || 'Not available';
  const lastUpdated = account.last_updated || account.lastUpdated || new Date().toISOString();
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div className="card" style={{ 
        maxWidth: '500px', 
        width: '90%', 
        maxHeight: '90vh',
        overflow: 'auto',
        position: 'relative',
        padding: '2rem'
      }}>
        <button 
          onClick={onClose}
          style={{ 
            position: 'absolute', 
            top: '1rem', 
            right: '1rem',
            background: 'none',
            border: 'none',
            fontSize: '1.5rem',
            cursor: 'pointer'
          }}
        >
          ×
        </button>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <AccountTypeIcon type={accountType} />
          <div>
            <h2 style={{ marginBottom: '0.25rem' }}>{account.name}</h2>
            <p style={{ color: 'var(--color-gray-500)' }}>{institutionName}</p>
          </div>
        </div>
        
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Balance</h3>
          <p style={{ 
            fontSize: '2rem', 
            fontWeight: 'bold',
            color: balance >= 0 ? 'var(--color-success)' : 'var(--color-danger)'
          }}>
            {formatCurrency(balance)}
          </p>
          {account.balances && account.balances.available !== null && (
            <p style={{ fontSize: '0.875rem', color: 'var(--color-gray-500)' }}>
              Available: {formatCurrency(account.balances.available)}
            </p>
          )}
        </div>
        
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Account Details</h3>
          <table style={{ width: '100%' }}>
            <tbody>
              <tr>
                <td style={{ padding: '0.5rem 0', color: 'var(--color-gray-500)' }}>Account Type</td>
                <td style={{ padding: '0.5rem 0', textAlign: 'right', textTransform: 'capitalize' }}>{accountType}</td>
              </tr>
              {account.subtype && (
                <tr>
                  <td style={{ padding: '0.5rem 0', color: 'var(--color-gray-500)' }}>Subtype</td>
                  <td style={{ padding: '0.5rem 0', textAlign: 'right', textTransform: 'capitalize' }}>{account.subtype}</td>
                </tr>
              )}
              <tr>
                <td style={{ padding: '0.5rem 0', color: 'var(--color-gray-500)' }}>Account Number</td>
                <td style={{ padding: '0.5rem 0', textAlign: 'right' }}>{accountNumber}</td>
              </tr>
              <tr>
                <td style={{ padding: '0.5rem 0', color: 'var(--color-gray-500)' }}>Last Updated</td>
                <td style={{ padding: '0.5rem 0', textAlign: 'right' }}>{formatDate(lastUpdated)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <button className="btn btn-outline" style={{ flex: 1 }} onClick={onClose}>Close</button>
          <Link to="/transactions" className="btn btn-primary" style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            View Transactions
          </Link>
        </div>
      </div>
    </div>
  );
};

const Accounts = () => {
  const { currentUser, token } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  useEffect(() => {
    // Fetch accounts using Plaid API
    const fetchAccounts = async () => {
      setLoading(true);
      setError('');
      
      try {
        const response = await getAccounts(token);
        
        if (response.success) {
          setAccounts(response.accounts);
        } else {
          setError(response.message || 'Failed to load accounts');
          console.error('Account loading error:', response);
          
          // In development, use mock data as fallback
          if (process.env.NODE_ENV === 'development') {
            console.log('Using mock data as fallback in development environment');
            
            const mockAccounts = [
              { 
                id: 1, 
                name: 'Main Checking', 
                institution: 'Chase', 
                balance: 2549.23, 
                type: 'checking',
                accountNumber: 'xxxx4321',
                lastUpdated: '2023-05-06T14:23:45Z'
              },
              { 
                id: 2, 
                name: 'Savings', 
                institution: 'Ally Bank', 
                balance: 8750.42, 
                type: 'savings',
                accountNumber: 'xxxx8765',
                lastUpdated: '2023-05-06T14:23:45Z'
              },
              { 
                id: 3, 
                name: 'Credit Card', 
                institution: 'American Express', 
                balance: -430.19, 
                type: 'credit',
                accountNumber: 'xxxx9876',
                lastUpdated: '2023-05-06T14:23:45Z'
              }
            ];
            
            setAccounts(mockAccounts);
          }
        }
      } catch (err) {
        setError('Failed to load accounts. Please try again later.');
        console.error('Account loading error:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAccounts();
  }, [token, refreshTrigger]);
  
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
  
  // Filter accounts based on selected filter
  const filteredAccounts = filter === 'all' 
    ? accounts 
    : accounts.filter(account => {
        const accountType = account.type || (account.subtype ? account.subtype : '');
        return accountType.toLowerCase().includes(filter.toLowerCase());
      });
  
  // Calculate balance totals
  const totalBalance = accounts.reduce((sum, account) => {
    const balance = account.balances ? account.balances.current : account.balance;
    return sum + balance;
  }, 0);
  
  const totalPositiveBalance = accounts.reduce((sum, account) => {
    const balance = account.balances ? account.balances.current : account.balance;
    return balance > 0 ? sum + balance : sum;
  }, 0);
  
  const totalNegativeBalance = Math.abs(accounts.reduce((sum, account) => {
    const balance = account.balances ? account.balances.current : account.balance;
    return balance < 0 ? sum + balance : sum;
  }, 0));
  
  // Handle viewing account details
  const handleViewAccountDetails = (account) => {
    setSelectedAccount(account);
  };
  
  // Extract unique account types for filtering
  const accountTypes = [...new Set(accounts.map(account => {
    const type = account.type || (account.subtype ? account.subtype : 'unknown');
    return type.toLowerCase();
  }))];
  
  if (loading && accounts.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <p>Loading your accounts...</p>
      </div>
    );
  }
  
  return (
    <div>
      <h1>Accounts</h1>
      
      {/* Account Summary */}
      <div className="grid grid-cols-3 mb-lg">
        <div className="card" style={{ margin: '0.5rem', padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Net Worth</h3>
          <p style={{ 
            fontSize: '1.75rem', 
            fontWeight: 'bold',
            color: totalBalance >= 0 ? 'var(--color-success)' : 'var(--color-danger)'
          }}>
            {formatCurrency(totalBalance)}
          </p>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-gray-500)' }}>
            Across {accounts.length} accounts
          </p>
        </div>
        
        <div className="card" style={{ margin: '0.5rem', padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Assets</h3>
          <p style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--color-success)' }}>
            {formatCurrency(totalPositiveBalance)}
          </p>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-gray-500)' }}>
            Total positive balance
          </p>
        </div>
        
        <div className="card" style={{ margin: '0.5rem', padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Debt</h3>
          <p style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--color-danger)' }}>
            {formatCurrency(totalNegativeBalance)}
          </p>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-gray-500)' }}>
            Total negative balance
          </p>
        </div>
      </div>
      
      {/* Add Account Banner */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ marginBottom: '0.5rem' }}>Connect a Bank Account</h2>
            <p style={{ color: 'var(--color-gray-500)' }}>
              Securely connect your financial institutions to automatically track your transactions.
            </p>
          </div>
          <PlaidLink 
            onSuccess={handlePlaidSuccess} 
            onExit={handlePlaidExit}
            buttonText="+ Connect Bank"
          />
        </div>
        
        <div style={{ marginTop: '1rem' }}>
          <Link to="/connected-accounts" className="btn btn-text" style={{ display: 'inline-flex', alignItems: 'center' }}>
            <span>Manage Connected Accounts</span> 
            <span style={{ marginLeft: '0.25rem' }}>→</span>
          </Link>
        </div>
      </div>
      
      {/* Accounts List */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2>Your Accounts</h2>
          <div>
            <select 
              className="input"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{ minWidth: '150px' }}
            >
              <option value="all">All Accounts</option>
              {accountTypes.map(type => (
                <option key={type} value={type} style={{ textTransform: 'capitalize' }}>{type}</option>
              ))}
            </select>
          </div>
        </div>
        
        {error && (
          <div style={{ 
            marginBottom: '1rem', 
            padding: '0.75rem', 
            backgroundColor: 'rgba(239, 68, 68, 0.1)', 
            color: 'var(--color-danger)',
            borderRadius: 'var(--radius-md)'
          }}>
            {error}
          </div>
        )}
        
        {filteredAccounts.length > 0 ? (
          filteredAccounts.map(account => (
            <AccountCard 
              key={account.id} 
              account={account} 
              onSelect={handleViewAccountDetails}
            />
          ))
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p style={{ marginBottom: '1rem', color: 'var(--color-gray-500)' }}>
              No accounts found.
            </p>
            <PlaidLink 
              onSuccess={handlePlaidSuccess} 
              onExit={handlePlaidExit}
              buttonText="Connect Your First Account"
            />
          </div>
        )}
      </div>
      
      {/* Account Detail Modal */}
      {selectedAccount && (
        <AccountDetailModal 
          account={selectedAccount}
          onClose={() => setSelectedAccount(null)}
        />
      )}
    </div>
  );
};

export default Accounts; 