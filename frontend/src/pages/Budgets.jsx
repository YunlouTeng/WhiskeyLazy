import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const Budgets = () => {
  const { currentUser } = useAuth();
  const [budgets, setBudgets] = useState([
    { id: 1, category: 'Food & Dining', limit: 600, spent: 423.45, color: 'bg-blue-500' },
    { id: 2, category: 'Entertainment', limit: 200, spent: 187.32, color: 'bg-purple-500' },
    { id: 3, category: 'Transportation', limit: 300, spent: 142.67, color: 'bg-green-500' },
    { id: 4, category: 'Shopping', limit: 400, spent: 251.89, color: 'bg-yellow-500' },
    { id: 5, category: 'Utilities', limit: 350, spent: 320.12, color: 'bg-red-500' },
  ]);

  // Calculate total budget and spending
  const totalBudget = budgets.reduce((total, budget) => total + budget.limit, 0);
  const totalSpent = budgets.reduce((total, budget) => total + budget.spent, 0);
  const totalRemaining = totalBudget - totalSpent;
  const percentSpent = Math.round((totalSpent / totalBudget) * 100);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Budget Tracker</h1>
      
      {/* Summary Card */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-sm text-gray-500">Total Budget</p>
            <p className="text-2xl font-bold text-gray-800">${totalBudget.toLocaleString()}</p>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-gray-500">Total Spent</p>
            <p className="text-2xl font-bold text-blue-600">${totalSpent.toLocaleString()}</p>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-gray-500">Remaining</p>
            <p className="text-2xl font-bold text-green-600">${totalRemaining.toLocaleString()}</p>
          </div>
        </div>
        
        <div className="mt-4">
          <div className="flex justify-between mb-1">
            <span className="text-sm text-gray-600">{percentSpent}% spent</span>
            <span className="text-sm text-gray-600">${totalSpent.toLocaleString()} / ${totalBudget.toLocaleString()}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full" 
              style={{ width: `${percentSpent}%` }}
            ></div>
          </div>
        </div>
      </div>
      
      {/* Budget Categories */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Budget Categories</h2>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Add New Budget
          </button>
        </div>
        
        <div className="space-y-4">
          {budgets.map(budget => {
            const percentUsed = Math.round((budget.spent / budget.limit) * 100);
            const isOverBudget = budget.spent > budget.limit;
            
            return (
              <div key={budget.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold">{budget.category}</h3>
                  <div className="text-sm font-medium">
                    <span className={isOverBudget ? 'text-red-600' : 'text-green-600'}>
                      ${budget.spent.toLocaleString()}
                    </span>
                    <span className="text-gray-500"> / ${budget.limit.toLocaleString()}</span>
                  </div>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`${budget.color} h-2 rounded-full ${isOverBudget ? 'bg-red-600' : ''}`} 
                    style={{ width: `${Math.min(percentUsed, 100)}%` }}
                  ></div>
                </div>
                
                <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                  <span>{percentUsed}% used</span>
                  <span className={isOverBudget ? 'text-red-600 font-medium' : ''}>
                    {isOverBudget 
                      ? `$${(budget.spent - budget.limit).toLocaleString()} over budget` 
                      : `$${(budget.limit - budget.spent).toLocaleString()} remaining`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm">Need to adjust your budgets?</p>
          <button className="mt-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300">
            Edit Budget Categories
          </button>
        </div>
      </div>
    </div>
  );
};

export default Budgets; 