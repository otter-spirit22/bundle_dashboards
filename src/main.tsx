import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";

import App from "./App";
import Principal from "./pages/Principal";
import Producer from "./pages/Producer";
import AccountManager from "./pages/AccountManager";
import DataDictionary from "./pages/DataDictionary";

// NEW PAGES
import Insights50 from "./pages/Insights50";
import About from "./pages/About";
import Pricing from "./pages/Pricing";
import Insights from "./pages/Insights"; // optional

// NEW: bring in the global store provider
import { DataProvider } from "@/data/store";

const router = createBrowserRouter([
  { path: "/", element: <App /> },
  { path: "/principal", element: <Principal /> },
  { path: "/producer", element: <Producer /> },
  { path: "/account-manager", element: <AccountManager /> },
  { path: "/data-dictionary", element: <DataDictionary /> },

  // New routes
  { path: "/about", element: <About /> },
  { path: "/pricing", element: <Pricing /> },
  { path: "/insights", element: <Insights /> },
  { path: "/insights-50", element: <Insights50 /> }, // optional
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {/* NEW: provider wraps the whole app so any page can read uploaded rows + insights */}
    <DataProvider>
      <RouterProvider router={router} />
    </DataProvider>
  </React.StrictMode>
);
