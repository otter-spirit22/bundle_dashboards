import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";

import App from "./App";
import Principal from "./pages/Principal";
import Producer from "./pages/Producer";
import AccountManager from "./pages/AccountManager";
import DataDictionary from "./pages/DataDictionary";
import Insights50 from "./pages/Insights50";
import About from "./pages/About";
import Pricing from "./pages/Pricing";
import Insights from "./pages/Insights";
import Household from "./pages/Household";

const router = createBrowserRouter([
  { path: "/", element: <App /> },
  { path: "/principal", element: <Principal /> },
  { path: "/producer", element: <Producer /> },
  { path: "/account-manager", element: <AccountManager /> },
  { path: "/data-dictionary", element: <DataDictionary /> },
  { path: "/about", element: <About /> },
  { path: "/pricing", element: <Pricing /> },
  { path: "/insights", element: <Insights /> },
  { path: "/insights-50", element: <Insights50 /> },
  { path: "/household/:id", element: <Household /> },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
