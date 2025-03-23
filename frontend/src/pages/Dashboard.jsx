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
import { useSupabaseAuth } from '../../../src/lib/supabaseHooks';

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
  const { user } = useSupabaseAuth();
  
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
  
  // Sample data - in a real app, this would come from your API/database
  const financialSummary = {
    totalBalance: 24680.42,
    accounts: 4,
    monthlyIncome: 6500,
    monthlyExpenses: 4280.75,
    budgetProgress: 68,
    recentTransactions: [
      { id: 1, date: '2023-06-15', description: 'Grocery Store', amount: -125.68, category: 'Food' },
      { id: 2, date: '2023-06-14', description: 'Salary Deposit', amount: 3250.00, category: 'Income' },
      { id: 3, date: '2023-06-12', description: 'Electric Bill', amount: -98.42, category: 'Utilities' },
      { id: 4, date: '2023-06-10', description: 'Restaurant', amount: -86.29, category: 'Dining' },
    ]
  };
  
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
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Welcome, {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}</h1>
        <p className="text-gray-600 mt-2">Here's your financial overview</p>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Balance</h3>
          <p className="text-3xl font-bold text-blue-600">${financialSummary.totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          <p className="text-sm text-gray-500 mt-2">Across {financialSummary.accounts} accounts</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Monthly Income</h3>
          <p className="text-3xl font-bold text-green-600">${financialSummary.monthlyIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          <p className="text-sm text-gray-500 mt-2">Current month</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Monthly Expenses</h3>
          <p className="text-3xl font-bold text-red-600">${financialSummary.monthlyExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          <p className="text-sm text-gray-500 mt-2">Current month</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Budget Progress</h3>
          <div className="w-full bg-gray-200 rounded-full h-2.5 mt-3 mb-4">
            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${financialSummary.budgetProgress}%` }}></div>
          </div>
          <p className="text-sm text-gray-500">{financialSummary.budgetProgress}% of monthly budget used</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link to="/accounts/connect" className="flex flex-col items-center justify-center p-4 bg-blue-50 rounded-lg text-blue-700 hover:bg-blue-100 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span className="text-sm font-medium">Connect Account</span>
          </Link>
          <Link to="/transactions" className="flex flex-col items-center justify-center p-4 bg-green-50 rounded-lg text-green-700 hover:bg-green-100 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span className="text-sm font-medium">View Transactions</span>
          </Link>
          <Link to="/budgets" className="flex flex-col items-center justify-center p-4 bg-purple-50 rounded-lg text-purple-700 hover:bg-purple-100 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="text-sm font-medium">Manage Budgets</span>
          </Link>
          <Link to="/settings" className="flex flex-col items-center justify-center p-4 bg-yellow-50 rounded-lg text-yellow-700 hover:bg-yellow-100 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-sm font-medium">Settings</span>
          </Link>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Recent Transactions</h2>
          <Link to="/transactions" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
            View All
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {financialSummary.recentTransactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(transaction.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {transaction.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {transaction.category}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-right ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {transaction.amount > 0 ? '+' : ''}${Math.abs(transaction.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 