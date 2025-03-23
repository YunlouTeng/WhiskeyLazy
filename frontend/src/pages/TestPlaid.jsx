import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import PlaidLink from '../components/PlaidLink';

const TestPlaid = () => {
  const { token, isAuthenticated } = useAuth();
  const [testResults, setTestResults] = useState([]);
  const [isRunningTests, setIsRunningTests] = useState(false);

  const addResult = (test, result, details = null) => {
    setTestResults(prev => [...prev, { test, result, details, timestamp: new Date().toISOString() }]);
  };

  const runTests = async () => {
    setIsRunningTests(true);
    setTestResults([]);
    
    // Test 1: Check if backend is reachable
    try {
      addResult('Backend connectivity', 'Running');
      const response = await axios.get(`${API_BASE_URL}/health-check`);
      
      if (response.status === 200) {
        addResult('Backend connectivity', 'Success', response.data);
      } else {
        addResult('Backend connectivity', 'Failed', `Status: ${response.status}`);
      }
    } catch (error) {
      addResult('Backend connectivity', 'Failed', `Error: ${error.message}`);
      // Try a direct ping to the base server without a specific endpoint
      try {
        const baseResponse = await axios.get('http://localhost:8000');
        addResult('Base server', baseResponse.status < 300 ? 'Available' : 'Error', 
          `Status: ${baseResponse.status}`);
      } catch (baseError) {
        addResult('Base server', 'Unreachable', `Error: ${baseError.message}`);
      }
    }
    
    // Test 2: Check JWT token
    if (token) {
      addResult('JWT Token', 'Available', `Token: ${token.substring(0, 15)}...`);
    } else {
      addResult('JWT Token', 'Missing', 'Authentication token is not available');
    }
    
    // Test 3: Manually request a Plaid link token
    if (token) {
      try {
        addResult('Create Link Token', 'Running');
        const linkResponse = await axios.post(
          `${API_BASE_URL}/plaid/create-link-token`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (linkResponse.data && linkResponse.data.link_token) {
          addResult('Create Link Token', 'Success', 
            `Received token: ${linkResponse.data.link_token.substring(0, 15)}...`);
        } else {
          addResult('Create Link Token', 'Failed', 'No link token in response');
        }
      } catch (error) {
        addResult('Create Link Token', 'Failed', 
          `Error: ${error.message}, Response: ${JSON.stringify(error.response?.data || {})}`);
      }
    }
    
    // Test 4: Check server ENV variables
    try {
      addResult('Server ENV Check', 'Running');
      const envResponse = await axios.get(`${API_BASE_URL}/debug/env`);
      
      if (envResponse.status === 200) {
        addResult('Server ENV Check', 'Response received', envResponse.data);
      } else {
        addResult('Server ENV Check', 'Failed', `Status: ${envResponse.status}`);
      }
    } catch (error) {
      addResult('Server ENV Check', 'Failed', `Error: ${error.message}`);
    }
    
    setIsRunningTests(false);
  };

  // Function to handle successful account connection
  const handleSuccess = (accounts) => {
    addResult('Account Connection', 'Success', accounts);
  };

  // Function to handle exit from Plaid Link
  const handleExit = (err) => {
    if (err) {
      addResult('Plaid Link Exit', 'Error', err);
    } else {
      addResult('Plaid Link Exit', 'User closed');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="mb-8 bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-4">Plaid Integration Test</h1>
        
        <div className="mb-4">
          <button 
            onClick={runTests} 
            disabled={isRunningTests}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {isRunningTests ? 'Running Tests...' : 'Run Diagnostic Tests'}
          </button>
        </div>
        
        <div className="border-t pt-4 mb-6">
          <h2 className="text-xl font-semibold mb-2">PlaidLink Component Test</h2>
          <div className="mb-4">
            <PlaidLink 
              onSuccess={handleSuccess}
              onExit={handleExit}
              buttonText="Test Plaid Connection"
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            />
          </div>
        </div>
        
        <div className="border-t pt-4">
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>
          
          {testResults.length === 0 ? (
            <p className="text-gray-500">No tests run yet. Click "Run Diagnostic Tests" to start.</p>
          ) : (
            <div className="space-y-4">
              {testResults.map((result, index) => (
                <div key={index} className="border rounded-md p-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">{result.test}</span>
                    <span className={`px-2 py-1 rounded text-sm ${
                      result.result === 'Success' || result.result === 'Available' 
                        ? 'bg-green-100 text-green-800' 
                        : result.result === 'Running'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-red-100 text-red-800'
                    }`}>
                      {result.result}
                    </span>
                  </div>
                  
                  {result.details && (
                    <pre className="text-xs bg-gray-100 p-2 mt-2 rounded overflow-x-auto">
                      {typeof result.details === 'object' 
                        ? JSON.stringify(result.details, null, 2) 
                        : result.details}
                    </pre>
                  )}
                  
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(result.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestPlaid; 