// src/components/NavMenu.tsx
import React from "react";
import { Link } from "react-router-dom";

export default function NavMenu() {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="badge border-white/20"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        Navigate ▾
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <nav
            className="absolute right-0 z-50 mt-2 w-56 rounded-lg border border-white/10 bg-slate-900/95 p-2 shadow-xl backdrop-blur"
            role="menu"
          >
            {[
              { to: "/principal", label: "Principal" },
              { to: "/producer", label: "Producer" },
              { to: "/account-manager", label: "Account Manager" },
              { to: "/insights-50", label: "Insights 50" },
              { to: "/insights", label: "Insights (List)" },
              { to: "/data-dictionary", label: "Data Dictionary" },
              { to: "/pricing", label: "Pricing" },
              { to: "/about", label: "About" },
              { to: "/household", label: "Household (detail)" },
            ].map((i) => (
              <Link
                key={i.to}
                to={i.to}
                onClick={() => setOpen(false)}
                className="block rounded px-3 py-2 text-sm hover:bg-white/10"
                role="menuitem"
              >
                {i.label}
              </Link>
            ))}
          </nav>
        </>
      )}
    </div>
  );
}
