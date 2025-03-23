import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import AuthProvider from './context/AuthContext';
import './index.css';
import App from './App';

// Import debug helpers in development mode
if (process.env.NODE_ENV === 'development') {
  import('./utils/debugHelper').then(module => {
    window.debugUtils = module.default;
    console.log('Debug utilities loaded and available as window.debugUtils');
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
); 