import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const Settings = () => {
  const { currentUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [name, setName] = useState(currentUser?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    transactions: true,
    security: true,
    marketing: false
  });
  const [notification, setNotification] = useState({ type: '', message: '' });
  
  // Show notification method
  const showNotification = (type, message) => {
    setNotification({
      type,
      message
    });
    
    // Auto hide after 5 seconds
    setTimeout(() => {
      setNotification({
        type: '',
        message: ''
      });
    }, 5000);
  };
  
  // Handle profile update
  const handleUpdateProfile = (e) => {
    e.preventDefault();
    
    // Validate
    if (!email || !name) {
      showNotification('error', 'Please fill in all required fields');
      return;
    }
    
    // In a real app, call API to update profile
    // For demo, we'll just show success
    showNotification('success', 'Profile updated successfully');
  };
  
  // Handle password change
  const handleChangePassword = (e) => {
    e.preventDefault();
    
    // Validate
    if (!currentPassword || !newPassword || !confirmPassword) {
      showNotification('error', 'Please fill in all password fields');
      return;
    }
    
    if (newPassword.length < 8) {
      showNotification('error', 'New password must be at least 8 characters long');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      showNotification('error', 'New passwords do not match');
      return;
    }
    
    // In a real app, call API to change password
    // For demo, we'll just show success
    showNotification('success', 'Password changed successfully');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };
  
  // Handle notification preference changes
  const handleNotificationChange = (key) => {
    setNotifications({
      ...notifications,
      [key]: !notifications[key]
    });
    
    // In a real app, save changes to API
    showNotification('success', 'Notification preferences updated');
  };
  
  // Handle account deletion
  const handleDeleteAccount = () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone.'
    );
    
    if (confirmed) {
      // In a real app, call API to delete account
      // For demo, we'll just logout
      logout();
    }
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
      </div>
      
      {/* Notification */}
      {notification.message && (
        <div className={`mb-6 p-4 rounded-md ${notification.type === 'success' ? 'bg-success-50 text-success-800' : 'bg-danger-50 text-danger-800'}`}>
          <div className="flex">
            <div className="flex-shrink-0">
              {notification.type === 'success' ? (
                <i className="material-icons text-success-400">check_circle</i>
              ) : (
                <i className="material-icons text-danger-400">error</i>
              )}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{notification.message}</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm flex items-center justify-center ${
                activeTab === 'profile'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <i className="material-icons mr-2">person</i>
              Profile
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm flex items-center justify-center ${
                activeTab === 'security'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <i className="material-icons mr-2">lock</i>
              Security
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm flex items-center justify-center ${
                activeTab === 'notifications'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <i className="material-icons mr-2">notifications</i>
              Notifications
            </button>
            <button
              onClick={() => setActiveTab('connectedAccounts')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm flex items-center justify-center ${
                activeTab === 'connectedAccounts'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <i className="material-icons mr-2">link</i>
              Connected Accounts
            </button>
          </nav>
        </div>
        
        {/* Tab Content */}
        <div className="p-6">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Profile Information</h2>
              
              <form onSubmit={handleUpdateProfile}>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className="label">
                      Name
                    </label>
                    <input
                      id="name"
                      type="text"
                      className="input"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your full name"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="label">
                      Email Address
                    </label>
                    <input
                      id="email"
                      type="email"
                      className="input"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your.email@example.com"
                    />
                  </div>
                  
                  <div className="flex items-center justify-end">
                    <button type="submit" className="btn btn-primary">
                      Update Profile
                    </button>
                  </div>
                </div>
              </form>
              
              <div className="mt-10 pt-8 border-t border-gray-200">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Delete Account</h2>
                <p className="text-sm text-gray-500 mb-4">
                  Once you delete your account, all of your personal data will be permanently removed.
                  This action cannot be undone.
                </p>
                <button
                  onClick={handleDeleteAccount}
                  className="btn bg-danger-600 text-white hover:bg-danger-700"
                >
                  Delete Account
                </button>
              </div>
            </div>
          )}
          
          {/* Security Tab */}
          {activeTab === 'security' && (
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Change Password</h2>
              
              <form onSubmit={handleChangePassword}>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="current-password" className="label">
                      Current Password
                    </label>
                    <input
                      id="current-password"
                      type="password"
                      className="input"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter your current password"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="new-password" className="label">
                      New Password
                    </label>
                    <input
                      id="new-password"
                      type="password"
                      className="input"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter your new password"
                      required
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Password must be at least 8 characters long.
                    </p>
                  </div>
                  
                  <div>
                    <label htmlFor="confirm-password" className="label">
                      Confirm New Password
                    </label>
                    <input
                      id="confirm-password"
                      type="password"
                      className="input"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your new password"
                      required
                    />
                  </div>
                  
                  <div className="flex items-center justify-end">
                    <button type="submit" className="btn btn-primary">
                      Change Password
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}
          
          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Notification Preferences</h2>
              
              <form>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="email-notifications"
                        name="email-notifications"
                        type="checkbox"
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        checked={notifications.email}
                        onChange={() => handleNotificationChange('email')}
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="email-notifications" className="font-medium text-gray-700">
                        Email Notifications
                      </label>
                      <p className="text-gray-500">
                        Receive notifications via email
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="push-notifications"
                        name="push-notifications"
                        type="checkbox"
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        checked={notifications.push}
                        onChange={() => handleNotificationChange('push')}
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="push-notifications" className="font-medium text-gray-700">
                        Push Notifications
                      </label>
                      <p className="text-gray-500">
                        Receive notifications on your device
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="transaction-updates"
                        name="transaction-updates"
                        type="checkbox"
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        checked={notifications.transactions}
                        onChange={() => handleNotificationChange('transactions')}
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="transaction-updates" className="font-medium text-gray-700">
                        Transaction Updates
                      </label>
                      <p className="text-gray-500">
                        New transactions, unusual activity, etc.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="security-alerts"
                        name="security-alerts"
                        type="checkbox"
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        checked={notifications.security}
                        onChange={() => handleNotificationChange('security')}
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="security-alerts" className="font-medium text-gray-700">
                        Security Alerts
                      </label>
                      <p className="text-gray-500">
                        Login attempts, password changes, etc.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="marketing"
                        name="marketing"
                        type="checkbox"
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        checked={notifications.marketing}
                        onChange={() => handleNotificationChange('marketing')}
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="marketing" className="font-medium text-gray-700">
                        Marketing
                      </label>
                      <p className="text-gray-500">
                        Product updates, new features, etc.
                      </p>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          )}
          
          {/* Connected Accounts Tab */}
          {activeTab === 'connectedAccounts' && (
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Connected Accounts</h2>
              
              <p className="text-sm text-gray-500 mb-6">
                Manage the financial institutions connected to your account.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-200">
                  <div className="flex items-center">
                    <div className="w-10 h-10 flex items-center justify-center bg-blue-100 rounded-full">
                      <i className="material-icons text-blue-600">account_balance</i>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-gray-900">Chase Bank</h3>
                      <p className="text-xs text-gray-500">Connected on May 12, 2023</p>
                    </div>
                  </div>
                  <button className="btn btn-sm btn-danger">
                    Disconnect
                  </button>
                </div>
                
                <div className="flex items-center justify-between py-3 border-b border-gray-200">
                  <div className="flex items-center">
                    <div className="w-10 h-10 flex items-center justify-center bg-purple-100 rounded-full">
                      <i className="material-icons text-purple-600">credit_card</i>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-gray-900">Visa Credit Card</h3>
                      <p className="text-xs text-gray-500">Connected on June 3, 2023</p>
                    </div>
                  </div>
                  <button className="btn btn-sm btn-danger">
                    Disconnect
                  </button>
                </div>
                
                <div className="flex items-center justify-between py-3 border-b border-gray-200">
                  <div className="flex items-center">
                    <div className="w-10 h-10 flex items-center justify-center bg-green-100 rounded-full">
                      <i className="material-icons text-green-600">payments</i>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-gray-900">American Express</h3>
                      <p className="text-xs text-gray-500">Connected on June 15, 2023</p>
                    </div>
                  </div>
                  <button className="btn btn-sm btn-danger">
                    Disconnect
                  </button>
                </div>
                
                <div className="mt-6">
                  <button className="btn btn-primary flex items-center justify-center">
                    <i className="material-icons mr-2">add_circle</i>
                    Connect New Account
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings; 