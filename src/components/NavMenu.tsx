// src/components/NavMenu.tsx
import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";

type NavItem = { label: string; to: string };

const primary: NavItem[] = [
  { label: "Principal", to: "/principal" },
  { label: "Producer", to: "/producer" },
  { label: "Account Manager", to: "/account-manager" },
];

const explore: NavItem[] = [
  { label: "Insights 50", to: "/insights-50" },
  { label: "Data Dictionary", to: "/data-dictionary" },
  { label: "Insights (List)", to: "/insights" },
  { label: "Pricing", to: "/pricing" },
  { label: "About", to: "/about" },
];

export default function NavMenu() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <nav className="flex items-center gap-2">
      {/* Primary links (desktop) */}
      <div className="hidden md:flex flex-wrap gap-2">
        {primary.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={`badge border-white/20 ${pathname === item.to ? "bg-white/10" : ""}`}
          >
            {item.label}
          </Link>
        ))}

        {/* Explore dropdown (desktop) */}
        <div className="relative group">
          <button type="button" className="badge border-white/20">
            Explore ▾
          </button>
          <div
            className="invisible opacity-0 group-hover:visible group-hover:opacity-100 transition
                       absolute right-0 z-40 mt-2 w-56 rounded-xl border border-white/10
                       bg-zinc-900/95 p-2 shadow-xl"
          >
            {explore.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`block w-full rounded-lg px-3 py-2 text-sm hover:bg-white/10 ${
                  pathname === item.to ? "bg-white/5" : ""
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Compact selector (mobile) */}
      <div className="md:hidden">
        <select
          className="rounded bg-white/10 px-2 py-1 text-sm"
          value={pathname.startsWith("/") ? pathname : "/"}
          onChange={(e) => navigate(e.target.value)}
        >
          <option value="/">Home</option>
          {[...primary, ...explore].map((item) => (
            <option key={item.to} value={item.to}>
              {item.label}
            </option>
          ))}
        </select>
      </div>
    </nav>
  );
}
