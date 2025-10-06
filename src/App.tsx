import { Link } from "react-router-dom";
import UploadDrawer from "./components/UploadDrawer";
import NavMenu from "./components/NavMenu";

export default function App() {
  return (
    <div className="mx-auto max-w-6xl p-6">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-extrabold uppercase text-indigo-300">Bundle Bench</h1>

        <div className="flex items-center gap-2">
          {/* New navigation (dropdown + selector) */}
          <NavMenu />
          {/* Existing uploader */}
          <UploadDrawer />
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="card">
          <h2 className="mb-2 font-bold">Welcome</h2>
          <p>Role dashboards for agency leaders, producers, and account managers.</p>
          <p>
            Use the <strong>Upload</strong> button to ingest CSV/XLSX and see computed dials.
          </p>
        </div>

        <div className="card">
          <h2 className="mb-2 font-bold">Next steps</h2>
          <ol className="ml-5 list-decimal space-y-1">
            <li>
              Wire real importer in <code>src/data/loader.ts</code>
            </li>
            <li>
              Replace mocks with computes in <code>src/data/metrics.ts</code>
            </li>
            <li>
              Adjust benchmarks in <code>src/config/benchmarks.ts</code>
            </li>
          </ol>
        </div>
      </div>

      {/* Quick links section */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
        <Link to="/principal" className="card hover:bg-white/5">
          <div className="font-semibold">Principal</div>
          <div className="text-sm text-slate-400">Agency overview + KPIs</div>
        </Link>
        <Link to="/producer" className="card hover:bg-white/5">
          <div className="font-semibold">Producer</div>
          <div className="text-sm text-slate-400">Growth pipeline + actions</div>
        </Link>
        <Link to="/account-manager" className="card hover:bg-white/5">
          <div className="font-semibold">Account Manager</div>
          <div className="text-sm text-slate-400">Renewals + service signals</div>
        </Link>
        <Link to="/insights-50" className="card hover:bg-white/5">
          <div className="font-semibold">Insights 50</div>
          <div className="text-sm text-slate-400">Computed opportunities & risk</div>
        </Link>
        <Link to="/data-dictionary" className="card hover:bg-white/5">
          <div className="font-semibold">Data Dictionary</div>
          <div className="text-sm text-slate-400">Definitions & formulas</div>
        </Link>
        <Link to="/insights" className="card hover:bg-white/5">
          <div className="font-semibold">Insights (List)</div>
          <div className="text-sm text-slate-400">Filterable insight feed</div>
        </Link>
        <Link to="/pricing" className="card hover:bg-white/5">
          <div className="font-semibold">Pricing</div>
          <div className="text-sm text-slate-400">Plans & packages</div>
        </Link>
        <Link to="/about" className="card hover:bg-white/5">
          <div className="font-semibold">About</div>
          <div className="text-sm text-slate-400">What is Bundle Bench?</div>
        </Link>
      </div>
    </div>
  );
}
