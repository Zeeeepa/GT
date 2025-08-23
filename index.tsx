import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { loadEnvironmentVariables } from './utils/env';

// Load environment variables before rendering
loadEnvironmentVariables().then(() => {
  console.log('Environment variables loaded successfully');
  
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error("Could not find root element to mount to");
  }
  
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}).catch(error => {
  console.error('Failed to load environment variables:', error);
  
  // Still render the app even if environment variables fail to load
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error("Could not find root element to mount to");
  }
  
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});
