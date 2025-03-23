import React from 'react';

const TransactionList = ({ transactions }) => {
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    const options = { month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // Get emoji for transaction category
  const getCategoryEmoji = (category) => {
    const categoryMap = {
      'Food and Drink': '🍔',
      'Groceries': '🛒',
      'Shopping': '🛍️',
      'Transportation': '🚗',
      'Travel': '✈️',
      'Entertainment': '🎭',
      'Health': '⚕️',
      'Utilities': '💡',
      'Rent': '🏠',
      'Income': '💰',
      'Transfer': '↔️',
      'Payment': '💸',
      'Education': '📚',
      'Subscription': '📱'
    };
    
    return categoryMap[category] || '💼';
  };

  if (!transactions || transactions.length === 0) {
    return (
      <div className="no-transactions">
        <p>No transactions to display.</p>
      </div>
    );
  }

  return (
    <div className="transaction-list">
      {transactions.map(transaction => (
        <div key={transaction.id} className="transaction-item">
          <div className="transaction-icon">
            {getCategoryEmoji(transaction.category)}
          </div>
          <div className="transaction-details">
            <div className="transaction-name">
              {transaction.name || transaction.description}
              {transaction.pending && <span className="pending-tag">Pending</span>}
            </div>
            <div className="transaction-info">
              <span className="transaction-date">{formatDate(transaction.date)}</span>
              <span className="transaction-account">{transaction.account_name}</span>
              <span className="transaction-category">{transaction.category}</span>
            </div>
          </div>
          <div className={`transaction-amount ${transaction.amount < 0 ? 'expense' : 'income'}`}>
            {formatCurrency(transaction.amount)}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TransactionList; 