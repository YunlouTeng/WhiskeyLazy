import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import { API_ENDPOINTS, handleApiError } from '../config/api';
import { getTransactions } from '../services/plaidService';
import { extractErrorMessage } from '../utils/errorHandling';

// Helper component for category badge
const CategoryBadge = ({ category }) => {
  // Generate background color based on category (just for visual variety)
  const getColorForCategory = (category) => {
    const categoryColors = {
      'Food': 'var(--color-primary-light)',
      'Income': 'var(--color-success-light)',
      'Utilities': 'var(--color-warning-light)',
      'Dining': 'var(--color-secondary-light)',
      'Transportation': 'var(--color-danger-light)',
      'Shopping': 'var(--color-primary-dark)',
      'Transfer': 'var(--color-gray-300)',
      'Health & Fitness': 'var(--color-success-dark)',
      'Entertainment': 'var(--color-secondary-dark)'
    };
    
    return categoryColors[category] || 'var(--color-gray-300)';
  };
  
  return (
    <span style={{
      backgroundColor: getColorForCategory(category),
      color: category === 'Income' ? 'var(--color-gray-900)' : 'white',
      padding: '0.25rem 0.5rem',
      borderRadius: 'var(--radius-md)',
      fontSize: '0.75rem',
      fontWeight: '500'
    }}>
      {category}
    </span>
  );
};

// Transaction row component
const TransactionRow = ({ transaction, onClick }) => {
  return (
    <div 
      className="card" 
      style={{ 
        margin: '0.5rem 0', 
        padding: '1rem', 
        cursor: 'pointer',
        opacity: transaction.pending ? 0.7 : 1
      }} 
      onClick={() => onClick(transaction)}
    >
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <div style={{ 
          width: '40px', 
          height: '40px', 
          borderRadius: '50%',
          backgroundColor: 'var(--color-gray-200)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.25rem',
          color: 'var(--color-gray-600)'
        }}>
          {transaction.category.charAt(0)}
        </div>
        
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <h3 style={{ marginBottom: '0.25rem' }}>{transaction.description}</h3>
            <p style={{ 
              fontWeight: 'bold',
              color: transaction.amount >= 0 ? 'var(--color-success)' : 'var(--color-danger)'
            }}>
              {formatCurrency(transaction.amount)}
            </p>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-gray-500)' }}>
                {formatDate(transaction.date)}
              </p>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-gray-500)' }}>
                • {transaction.accountName}
              </p>
              {transaction.pending && (
                <span style={{ 
                  fontSize: '0.75rem', 
                  backgroundColor: 'var(--color-gray-200)', 
                  padding: '0.125rem 0.375rem',
                  borderRadius: 'var(--radius-md)'
                }}>
                  Pending
                </span>
              )}
            </div>
            <CategoryBadge category={transaction.category} />
          </div>
        </div>
      </div>
    </div>
  );
};

// Transaction detail modal
const TransactionDetailModal = ({ transaction, onClose, onEdit }) => {
  if (!transaction) return null;
  
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
        
        <h2 style={{ marginBottom: '1.5rem' }}>Transaction Details</h2>
        
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{transaction.description}</h3>
          <p style={{ 
            fontSize: '2rem', 
            fontWeight: 'bold',
            color: transaction.amount >= 0 ? 'var(--color-success)' : 'var(--color-danger)'
          }}>
            {formatCurrency(transaction.amount)}
          </p>
          {transaction.pending && (
            <p style={{ 
              display: 'inline-block',
              margin: '0.5rem 0',
              padding: '0.25rem 0.5rem',
              backgroundColor: 'var(--color-gray-200)', 
              borderRadius: 'var(--radius-md)',
              fontSize: '0.875rem'
            }}>
              Pending - Not yet posted to your account
            </p>
          )}
        </div>
        
        <div style={{ marginBottom: '1.5rem' }}>
          <table style={{ width: '100%' }}>
            <tbody>
              <tr>
                <td style={{ padding: '0.5rem 0', color: 'var(--color-gray-500)' }}>Date</td>
                <td style={{ padding: '0.5rem 0', textAlign: 'right' }}>{formatDate(transaction.date)}</td>
              </tr>
              <tr>
                <td style={{ padding: '0.5rem 0', color: 'var(--color-gray-500)' }}>Category</td>
                <td style={{ padding: '0.5rem 0', textAlign: 'right' }}>
                  <CategoryBadge category={transaction.category} />
                </td>
              </tr>
              <tr>
                <td style={{ padding: '0.5rem 0', color: 'var(--color-gray-500)' }}>Account</td>
                <td style={{ padding: '0.5rem 0', textAlign: 'right' }}>{transaction.accountName}</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <button className="btn btn-outline" style={{ flex: 1 }} onClick={onClose}>Close</button>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => onEdit(transaction)}>
            Edit Category
          </button>
        </div>
      </div>
    </div>
  );
};

// Edit category modal
const EditCategoryModal = ({ transaction, categories, onSave, onCancel }) => {
  const [selectedCategory, setSelectedCategory] = useState(transaction.category);
  
  const handleSave = () => {
    onSave({ ...transaction, category: selectedCategory });
  };
  
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
      zIndex: 1001
    }}>
      <div className="card" style={{ 
        maxWidth: '500px', 
        width: '90%', 
        maxHeight: '90vh',
        overflow: 'auto',
        position: 'relative',
        padding: '2rem'
      }}>
        <h2 style={{ marginBottom: '1.5rem' }}>Edit Category</h2>
        
        <div style={{ marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{transaction.description}</h3>
          <p style={{ 
            fontSize: '1.5rem', 
            fontWeight: 'bold',
            color: transaction.amount >= 0 ? 'var(--color-success)' : 'var(--color-danger)',
            marginBottom: '1.5rem'
          }}>
            {formatCurrency(transaction.amount)}
          </p>
        </div>
        
        <div className="form-group">
          <label htmlFor="category" className="label">Category</label>
          <select 
            id="category" 
            className="input" 
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
          <button className="btn btn-outline" style={{ flex: 1 }} onClick={onCancel}>Cancel</button>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSave}>Save Changes</button>
        </div>
      </div>
    </div>
  );
};

const Transactions = () => {
  const { token } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  
  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Call our enhanced plaidService function
        const result = await getTransactions(
          token, 
          dateRange.startDate || undefined, 
          dateRange.endDate || undefined
        );
        
        if (result.success) {
          setTransactions(result.transactions || []);
        } else {
          setError(result.message || 'Failed to fetch transactions');
        }
      } catch (err) {
        console.error('Error fetching transactions:', err);
        setError(extractErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    
    fetchTransactions();
  }, [token, dateRange.startDate, dateRange.endDate]);
  
  // Get unique categories
  const categories = [...new Set(transactions.map(t => t.category))].sort();
  
  // Filter transactions
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = filter === '' || 
      transaction.name?.toLowerCase().includes(filter.toLowerCase()) ||
      transaction.description?.toLowerCase().includes(filter.toLowerCase()) ||
      transaction.merchant_name?.toLowerCase().includes(filter.toLowerCase());
    
    const matchesCategory = categoryFilter === '' || transaction.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });
  
  // Calculate statistics
  const stats = {
    totalTransactions: filteredTransactions.length,
    totalExpenses: filteredTransactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0),
    totalIncome: filteredTransactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0),
    netCashflow: filteredTransactions.reduce((sum, t) => sum + t.amount, 0)
  };
  
  // Sort transactions by date (newest first)
  const sortedTransactions = [...filteredTransactions].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );
  
  const handleFilterChange = (e) => {
    setFilter(e.target.value);
  };
  
  const handleCategoryChange = (e) => {
    setCategoryFilter(e.target.value);
  };
  
  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  if (loading) {
    return (
      <div className="loading-container">
        <p>Loading transactions...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="error-container">
        <h2>Error Loading Transactions</h2>
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="btn btn-primary"
        >
          Try Again
        </button>
      </div>
    );
  }
  
  return (
    <div className="transactions-page">
      <h1>Transactions</h1>
      
      {/* Filters */}
      <div className="filters-container">
        <div className="filter-section">
          <label htmlFor="search">Search:</label>
          <input
            type="text"
            id="search"
            placeholder="Search transactions..."
            value={filter}
            onChange={handleFilterChange}
            className="form-input"
          />
        </div>
        
        <div className="filter-section">
          <label htmlFor="category">Category:</label>
          <select
            id="category"
            value={categoryFilter}
            onChange={handleCategoryChange}
            className="form-select"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
        
        <div className="filter-section">
          <label htmlFor="startDate">From:</label>
          <input
            type="date"
            id="startDate"
            name="startDate"
            value={dateRange.startDate}
            onChange={handleDateChange}
            className="form-input"
          />
        </div>
        
        <div className="filter-section">
          <label htmlFor="endDate">To:</label>
          <input
            type="date"
            id="endDate"
            name="endDate"
            value={dateRange.endDate}
            onChange={handleDateChange}
            className="form-input"
          />
        </div>
      </div>
      
      {/* Stats Summary */}
      <div className="stats-container">
        <div className="stat-card">
          <h3>Total Transactions</h3>
          <p>{stats.totalTransactions}</p>
        </div>
        
        <div className="stat-card">
          <h3>Total Expenses</h3>
          <p className="expense">{formatCurrency(stats.totalExpenses)}</p>
        </div>
        
        <div className="stat-card">
          <h3>Total Income</h3>
          <p className="income">{formatCurrency(stats.totalIncome)}</p>
        </div>
        
        <div className="stat-card">
          <h3>Net Cashflow</h3>
          <p className={stats.netCashflow >= 0 ? 'income' : 'expense'}>
            {formatCurrency(stats.netCashflow)}
          </p>
        </div>
      </div>
      
      {/* Transactions Table */}
      <div className="transactions-container">
        <table className="transactions-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Category</th>
              <th>Account</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {sortedTransactions.length > 0 ? (
              sortedTransactions.map(transaction => (
                <tr key={transaction.id}>
                  <td>{formatDate(transaction.date)}</td>
                  <td className="description">
                    <div className="merchant">{transaction.name}</div>
                    {transaction.pending && <span className="pending-tag">Pending</span>}
                  </td>
                  <td>{transaction.category}</td>
                  <td>
                    {transaction.account_name}
                    <div className="institution">{transaction.institution_name}</div>
                  </td>
                  <td className={`amount ${transaction.amount < 0 ? 'expense' : 'income'}`}>
                    {formatCurrency(transaction.amount)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="no-transactions">
                  No transactions found matching your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Transactions; 