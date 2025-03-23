import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Pie, Line, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title } from 'chart.js';
import { formatCurrency } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL, API_ENDPOINTS, handleApiError } from '../config/api';
import api from '../config/api';
import { getAccounts, getTransactions } from '../services/plaidService';
import { extractErrorMessage } from '../utils/errorHandling';
import AccountCard from '../components/AccountCard';
import TransactionList from '../components/TransactionList';
import BalanceChart from '../components/BalanceChart';

// Register ChartJS components
ChartJS.register(
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement,
  BarElement,
  Title
);

// Card component for displaying summary information
const SummaryCard = ({ title, value, icon, trend, trendValue, className }) => {
  return (
    <div className={`card ${className}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          {trendValue && (
            <div className="flex items-center mt-1">
              <i className={`material-icons h-4 w-4 ${trend === 'up' ? 'text-success-500' : 'text-danger-500'} mr-1`}>
                {trend === 'up' ? 'trending_up' : 'trending_down'}
              </i>
              <span className={`text-sm ${trend === 'up' ? 'text-success-500' : 'text-danger-500'}`}>
                {trendValue}
              </span>
            </div>
          )}
        </div>
        <div className="p-3 rounded-full bg-primary-50">
          <i className="material-icons h-6 w-6 text-primary-600">{icon}</i>
        </div>
      </div>
    </div>
  );
};

// Helper functions
const formatDate = (dateString) => {
  const options = { month: 'short', day: 'numeric', year: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
};

// Category colors for charts
const categoryColors = {
  'Food': 'rgba(255, 99, 132, 0.8)',
  'Income': 'rgba(138, 75, 255, 0.8)',
  'Utilities': 'rgba(255, 206, 86, 0.8)',
  'Dining': 'rgba(75, 192, 192, 0.8)',
  'Transportation': 'rgba(153, 102, 255, 0.8)',
  'Shopping': 'rgba(255, 159, 64, 0.8)',
  'Entertainment': 'rgba(188, 140, 255, 0.8)',
  'Health': 'rgba(83, 102, 255, 0.8)',
  'Other': 'rgba(159, 159, 159, 0.8)'
};

// Category icons mapping
const categoryIcons = {
  'Food': 'restaurant',
  'Income': 'account_balance',
  'Utilities': 'home',
  'Dining': 'fastfood',
  'Transportation': 'directions_car',
  'Shopping': 'shopping_bag',
  'Entertainment': 'movie',
  'Health': 'healing',
  'Other': 'more_horiz'
};

const Dashboard = () => {
  const { currentUser, token } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [monthlySpending, setMonthlySpending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [visualizationType, setVisualizationType] = useState('spending'); // 'spending' or 'assets'
  
  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Get accounts
        const accountsResponse = await getAccounts(token);
        
        if (accountsResponse.success) {
          setAccounts(accountsResponse.accounts);
        } else {
          console.error('Failed to load accounts:', accountsResponse.message);
          setError('Failed to load accounts. ' + accountsResponse.message);
        }
        
        // Get transactions
        const transactionsResponse = await getTransactions(token);
        
        if (transactionsResponse.success) {
          // Sort by date (newest first)
          const sortedTransactions = [...transactionsResponse.transactions]
            .sort((a, b) => new Date(b.date) - new Date(a.date));
          
          setTransactions(sortedTransactions);
        } else {
          console.error('Failed to load transactions:', transactionsResponse.message);
          setError('Failed to load transactions. ' + transactionsResponse.message);
        }
        
        // Get monthly spending data
        try {
          const monthlyResponse = await api.get('/spending/monthly');
          setMonthlySpending(monthlyResponse.data);
        } catch (err) {
          console.error('Failed to load monthly spending:', err);
          // Don't set error here, it's not critical for the dashboard
          
          // Use mock data instead
          setMonthlySpending([
            { month: 'Jan', totalSpent: 1245.67 },
            { month: 'Feb', totalSpent: 1378.42 },
            { month: 'Mar', totalSpent: 1156.89 },
            { month: 'Apr', totalSpent: 1489.32 },
            { month: 'May', totalSpent: 1298.76 },
            { month: 'Jun', totalSpent: 1422.18 }
          ]);
        }
      } catch (err) {
        console.error('Dashboard error:', err);
        setError('An unexpected error occurred. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [token]);
  
  // Calculate total balance across all accounts
  const totalBalance = accounts.reduce((total, account) => total + account.balance, 0);
  
  // Get recent transactions (last 5)
  const recentTransactions = transactions.slice(0, 5);
  
  // Process data for Spending by Category chart
  const calculateCategorySpending = () => {
    // Get only expenses (negative amounts)
    const expenses = transactions.filter(t => t.amount < 0);
    
    // Create an object to hold total spending by category
    const categoryTotals = {};
    
    // Calculate totals
    expenses.forEach(transaction => {
      const category = transaction.category;
      const amount = Math.abs(transaction.amount);
      
      if (categoryTotals[category]) {
        categoryTotals[category] += amount;
      } else {
        categoryTotals[category] = amount;
      }
    });
    
    // Extract categories and spending amounts
    const categories = Object.keys(categoryTotals);
    const spendingAmounts = Object.values(categoryTotals);
    const backgroundColors = categories.map(category => categoryColors[category] || categoryColors['Other']);
    
    return {
      categories,
      spendingAmounts,
      backgroundColors,
      categoryTotals
    };
  };
  
  const { categories, spendingAmounts, backgroundColors, categoryTotals } = calculateCategorySpending();
  
  // Setup category chart data
  const categoryChartData = {
    labels: categories,
    datasets: [
      {
        data: spendingAmounts,
        backgroundColor: backgroundColors,
        borderColor: backgroundColors.map(color => color.replace('0.8', '1')),
        borderWidth: 1,
      },
    ],
  };
  
  // Setup monthly chart data
  const monthlyChartData = {
    labels: monthlySpending.map(item => item.month),
    datasets: [
      {
        label: 'Monthly Spending',
        data: monthlySpending.map(item => item.totalSpent),
        backgroundColor: 'rgba(138, 75, 255, 0.6)',
        borderColor: 'rgba(138, 75, 255, 1)',
        borderWidth: 1,
      },
    ],
  };
  
  // Create asset distribution data (mocked for now)
  const assetDistributionData = {
    labels: accounts.length > 0 ? accounts.map(account => account.name) : ['No Data'],
    datasets: [
      {
        label: 'Asset Distribution',
        data: accounts.length > 0 ? accounts.map(account => account.balance) : [0],
        backgroundColor: 'rgba(138, 75, 255, 0.6)',
        borderColor: 'rgba(138, 75, 255, 1)',
        borderWidth: 1,
      },
    ],
  };
  
  // Chart options for pie chart
  const pieChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.raw || 0;
            return `${label}: ${formatCurrency(value)}`;
          }
        }
      }
    }
  };
  
  // Chart options for bar chart
  const barChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const value = context.raw || 0;
            return `Total: ${formatCurrency(value)}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return formatCurrency(value);
          }
        }
      }
    }
  };
  
  // Handle switching visualization type
  const handlePrevVisualization = () => {
    setVisualizationType(visualizationType === 'spending' ? 'assets' : 'spending');
  };
  
  const handleNextVisualization = () => {
    setVisualizationType(visualizationType === 'spending' ? 'assets' : 'spending');
  };
  
  // Calculate average and highest month spending
  const calculateSpendingStats = () => {
    if (!monthlySpending || monthlySpending.length === 0) {
      return { average: 0, highest: 0, highestMonth: 'N/A' };
    }
    
    const total = monthlySpending.reduce((sum, month) => sum + month.totalSpent, 0);
    const average = total / monthlySpending.length;
    
    const highest = Math.max(...monthlySpending.map(month => month.totalSpent));
    const highestMonth = monthlySpending.find(month => month.totalSpent === highest)?.month || 'N/A';
    
    return { average, highest, highestMonth };
  };
  
  const { average, highest, highestMonth } = calculateSpendingStats();
  
  if (loading) {
    return (
      <div className="dashboard-loading">
        <p>Loading your financial data...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="dashboard-error">
        <h2>Something went wrong</h2>
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
    <div className="dashboard">
      <h1>Your Financial Overview</h1>
      
      {accounts.length === 0 ? (
        <div className="connect-account-prompt">
          <h2>Connect Your First Account</h2>
          <p>To get started, connect a bank account to track your finances</p>
          <a href="/connected-accounts" className="btn btn-primary">Connect a Bank Account</a>
        </div>
      ) : (
        <>
          {/* Summary Section */}
          <div className="dashboard-summary">
            <div className="summary-card total-balance">
              <h3>Total Balance</h3>
              <p className="amount">
                {formatCurrency(totalBalance)}
              </p>
            </div>
            
            <div className="summary-card accounts-count">
              <h3>Connected Accounts</h3>
              <p className="count">{accounts.length}</p>
            </div>
            
            <div className="summary-card transactions-count">
              <h3>Recent Transactions</h3>
              <p className="count">{transactions.length}</p>
            </div>
          </div>
          
          {/* Monthly Spending Chart Section - With left/right arrows */}
          <section className="dashboard-section">
            <div className="section-header">
              <button 
                className="visualization-arrow left-arrow" 
                onClick={handlePrevVisualization}
                aria-label="Previous visualization"
              >
                <i className="material-icons">chevron_left</i>
              </button>
              
              <div className="chart-title-container">
                <h2 className="chart-title">
                  {visualizationType === 'spending' ? 'Monthly Spending Trend' : 'Asset Distribution'}
                </h2>
              </div>
              
              <button 
                className="visualization-arrow right-arrow" 
                onClick={handleNextVisualization}
                aria-label="Next visualization"
              >
                <i className="material-icons">chevron_right</i>
              </button>
            </div>
            
            <div className="chart-container">
              {visualizationType === 'spending' ? (
                <BalanceChart data={monthlySpending} />
              ) : (
                <div className="asset-chart">
                  <Bar data={assetDistributionData} options={barChartOptions} />
                </div>
              )}
              
              {visualizationType === 'spending' && (
                <div className="chart-stats">
                  <div className="stat-box">
                    <div className="stat-label">Average Monthly</div>
                    <div className="stat-value">{formatCurrency(average)}</div>
                  </div>
                  <div className="stat-box">
                    <div className="stat-label">Highest Month</div>
                    <div className="stat-value">{formatCurrency(highest)}</div>
                  </div>
                </div>
              )}
            </div>
          </section>
          
          {/* Accounts Section */}
          <section className="dashboard-section">
            <div className="section-header">
              <h2>Your Accounts</h2>
              <a href="/accounts" className="view-all">View All</a>
            </div>
            
            <div className="accounts-grid">
              {accounts.map(account => (
                <AccountCard key={account.id} account={account} />
              ))}
            </div>
          </section>
          
          {/* Transactions Section */}
          <section className="dashboard-section">
            <div className="section-header">
              <h2>Recent Transactions</h2>
              <a href="/transactions" className="view-all">View All</a>
            </div>
            
            <TransactionList transactions={recentTransactions} />
          </section>
        </>
      )}
    </div>
  );
};

export default Dashboard; 