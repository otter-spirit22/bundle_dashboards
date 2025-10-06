import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './index.css';

import App from './App';
import Principal from './pages/Principal';
import Producer from './pages/Producer';
import AccountManager from './pages/AccountManager';

// NEW PAGES
import About from './pages/About';
import Pricing from './pages/Pricing';
import Insights from './pages/Insights'; // optional

const router = createBrowserRouter([
  { path: '/', element: <App /> },
  { path: '/principal', element: <Principal /> },
  { path: '/producer', element: <Producer /> },
  { path: '/account-manager', element: <AccountManager /> },

  // New routes
  { path: '/about', element: <About /> },
  { path: '/pricing', element: <Pricing /> },
  { path: '/insights', element: <Insights /> }, // optional
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
