import React from 'react';

const AccountCard = ({ account }) => {
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Determine the card color based on account type
  const getCardColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'depository':
      case 'checking':
      case 'savings':
        return 'bg-blue-50 border-blue-200';
      case 'credit':
        return 'bg-red-50 border-red-200';
      case 'investment':
        return 'bg-green-50 border-green-200';
      case 'loan':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  // Determine account icon based on type
  const getAccountIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'depository':
      case 'checking':
      case 'savings':
        return '💰';
      case 'credit':
        return '💳';
      case 'investment':
        return '📈';
      case 'loan':
        return '🏦';
      default:
        return '🏛️';
    }
  };

  return (
    <div className={`account-card ${getCardColor(account.type)}`}>
      <div className="account-icon">
        {getAccountIcon(account.type)}
      </div>
      <div className="account-details">
        <h3 className="account-name">{account.name}</h3>
        <div className="account-info">
          <div className="account-institution">{account.institution}</div>
          {account.mask && <div className="account-mask">••••{account.mask}</div>}
        </div>
        <div className="account-type-badge">
          {account.subtype || account.type || 'Account'}
        </div>
      </div>
      <div className="account-balance">
        <div className="balance-amount">
          {formatCurrency(account.balance)}
        </div>
        <div className="balance-label">Available</div>
      </div>
    </div>
  );
};

export default AccountCard; 