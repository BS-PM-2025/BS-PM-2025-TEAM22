// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import "./App.css";
import App from './App';
import { SocialProvider } from './contexts/SocialContext';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
   <Router>
      <SocialProvider>
        <App />
      </SocialProvider>
    </Router>
  </React.StrictMode>
);

// מדידת ביצועים (אופציונלי)
reportWebVitals();
