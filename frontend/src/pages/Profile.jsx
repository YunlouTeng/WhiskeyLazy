import React from 'react';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { currentUser } = useAuth();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Your Profile</h1>
        
        {currentUser ? (
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-600 text-white rounded-full w-16 h-16 flex items-center justify-center text-xl font-bold">
                {currentUser.email ? currentUser.email.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <h2 className="text-xl font-semibold">{currentUser.user_metadata?.full_name || 'User'}</h2>
                <p className="text-gray-600">{currentUser.email}</p>
              </div>
            </div>
            
            <div className="mt-8 border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Account Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium">{currentUser.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Account ID</p>
                  <p className="font-medium">{currentUser.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Last Sign In</p>
                  <p className="font-medium">{new Date(currentUser.last_sign_in_at).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Account Created</p>
                  <p className="font-medium">{new Date(currentUser.created_at).toLocaleString()}</p>
                </div>
              </div>
            </div>
            
            <div className="mt-8 pt-6">
              <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors">
                Edit Profile
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600">Loading user information...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile; 