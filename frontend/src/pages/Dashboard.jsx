import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Pie, Line, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title } from 'chart.js';
import { formatCurrency } from '../utils/formatters';
import { API_BASE_URL, API_ENDPOINTS, handleApiError } from '../config/api';
import api from '../config/api';
// Commenting out until we integrate these with Supabase
// import { getAccounts, getTransactions } from '../services/plaidService';
import { extractErrorMessage } from '../utils/errorHandling';
import AccountCard from '../components/AccountCard';
import TransactionList from '../components/TransactionList';
import BalanceChart from '../components/BalanceChart';
import { useAuth } from '../context/AuthContext';

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
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);

  // Mock data - would come from API in production
  const dashboardData = {
    totalBalance: 12700.00,
    connectedAccounts: 5,
    recentTransactions: 16,
    accounts: [
      { id: 1, name: 'Plaid Checking', institution: 'Unknown Institution', mask: '0000', balance: 110.00, type: 'Checking' },
      { id: 2, name: 'Plaid Saving', institution: 'Unknown Institution', mask: '1111', balance: 210.00, type: 'Savings' },
      { id: 3, name: 'Plaid Cash Management', institution: 'Unknown Institution', mask: '9002', balance: 12060.00, type: 'Cash Management' },
      { id: 4, name: 'Plaid Checking', institution: 'Unknown Institution', mask: '0000', balance: 110.00, type: 'Checking' },
      { id: 5, name: 'Plaid Saving', institution: 'Unknown Institution', mask: '1111', balance: 210.00, type: 'Savings' },
    ],
    transactions: [
      { id: 1, date: '2023-03-19', description: 'CREDIT CARD 3333 PAYMENT */', amount: -25.00, account: 'Plaid Saving', category: 'Payment' },
      { id: 2, date: '2023-03-19', description: 'Uber 063015 SF**POOL**', amount: -5.40, account: 'Plaid Checking', category: 'Travel' },
      { id: 3, date: '2023-03-19', description: 'CREDIT CARD 3333 PAYMENT */', amount: -25.00, account: 'Plaid Saving', category: 'Payment' },
      { id: 4, date: '2023-03-19', description: 'Uber 063015 SF**POOL**', amount: -5.40, account: 'Plaid Checking', category: 'Travel' },
      { id: 5, date: '2023-03-17', description: 'United Airlines', amount: 500.00, account: 'Plaid Checking', category: 'Travel' },
    ],
    monthlySpending: [
      { month: 'December', amount: 1200.50 },
      { month: 'January', amount: 1350.75 },
      { month: 'February', amount: 1150.25 },
      { month: 'March', amount: 1489.32 },
      { month: 'April', amount: 1300.45 },
      { month: 'May', amount: 1400.60 },
    ],
    averageMonthly: 1331.87,
    highestMonth: 1489.32,
  };

  // Monthly spending chart data
  const chartData = {
    labels: dashboardData.monthlySpending.map(item => item.month),
    datasets: [
      {
        data: dashboardData.monthlySpending.map(item => item.amount),
        backgroundColor: '#965cf6',
        borderRadius: 4,
        barThickness: 35,
      }
    ]
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `$${context.raw.toFixed(2)}`;
          }
        }
      }
    },
    scales: {
      y: {
        display: false,
        grid: {
          display: false,
        }
      },
      x: {
        grid: {
          display: false,
        }
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Your Financial Overview</h1>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Total Balance Card */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-gray-500 text-sm font-medium mb-2">Total Balance</h3>
          <p className="text-3xl font-bold">${dashboardData.totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
        
        {/* Connected Accounts Card */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-gray-500 text-sm font-medium mb-2">Connected Accounts</h3>
          <p className="text-3xl font-bold text-indigo-600">{dashboardData.connectedAccounts}</p>
        </div>
        
        {/* Recent Transactions Card */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-gray-500 text-sm font-medium mb-2">Recent Transactions</h3>
          <p className="text-3xl font-bold text-indigo-600">{dashboardData.recentTransactions}</p>
        </div>
      </div>
      
      {/* Monthly Spending Chart */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Monthly Spending Trend</h2>
          <div className="flex space-x-2">
            <button className="p-2 rounded hover:bg-gray-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>
            <button className="p-2 rounded hover:bg-gray-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="h-64 mb-6">
          <Bar data={chartData} options={chartOptions} />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-500 text-sm mb-1">Average Monthly</p>
            <p className="text-2xl font-bold">${dashboardData.averageMonthly.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-500 text-sm mb-1">Highest Month</p>
            <p className="text-2xl font-bold">${dashboardData.highestMonth.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
        </div>
      </div>
      
      {/* Your Accounts */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Your Accounts</h2>
          <Link to="/accounts" className="text-indigo-600 hover:text-indigo-800 font-medium">View All</Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {dashboardData.accounts.slice(0, 3).map(account => (
            <div key={account.id} className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-yellow-800">💰</span>
                </div>
                <div>
                  <h3 className="font-semibold">{account.name}</h3>
                  <p className="text-gray-500 text-sm">{account.institution} ••••{account.mask}</p>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">{account.type}</span>
                <span className="font-bold">${account.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <p className="text-sm text-gray-500 text-right">Available</p>
            </div>
          ))}
        </div>
      </div>
      
      {/* Recent Transactions */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Recent Transactions</h2>
          <Link to="/transactions" className="text-indigo-600 hover:text-indigo-800 font-medium">View All</Link>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {dashboardData.transactions.map((transaction, index) => (
            <div key={transaction.id} className={`p-4 ${index !== dashboardData.transactions.length - 1 ? 'border-b' : ''}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                    {transaction.category === 'Payment' ? (
                      <span>💳</span>
                    ) : transaction.category === 'Travel' ? (
                      <span>✈️</span>
                    ) : (
                      <span>💰</span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium">{transaction.description}</h3>
                    <div className="flex text-sm text-gray-500 space-x-2">
                      <span>{new Date(transaction.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      <span>•</span>
                      <span>{transaction.account}</span>
                      <span>•</span>
                      <span>{transaction.category}</span>
                    </div>
                  </div>
                </div>
                <span className={`font-medium ${transaction.amount < 0 ? 'text-red-500' : 'text-green-500'}`}>
                  {transaction.amount < 0 ? '-' : ''}${Math.abs(transaction.amount).toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 