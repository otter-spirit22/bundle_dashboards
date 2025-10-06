import { Link } from "react-router-dom";
import UploadDrawer from "./components/UploadDrawer";

export default function App() {
  return (
    <div className="mx-auto max-w-6xl p-6">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-extrabold uppercase text-indigo-300">
          Bundle Bench
        </h1>

        <nav className="flex gap-2">
          <Link className="badge border-white/20" to="/principal">
            Principal
          </Link>
          <Link className="badge border-white/20" to="/producer">
            Producer
          </Link>
          <Link className="badge border-white/20" to="/account-manager">
            Account Manager
          </Link>
          <Link className="badge border-white/20" to="/insights">
            Insights
          </Link>
          <Link className="badge border-white/20" to="/about">
            About
          </Link>
          <Link className="badge border-white/20" to="/pricing">
            Pricing
          </Link>

          <UploadDrawer />
        </nav>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="card">
          <h2 className="font-bold mb-2">Welcome</h2>
          <p>Role dashboards for agency leaders, producers, and account managers.</p>
          <p>
            Use the <strong>Upload</strong> button to ingest CSV/XLSX and see
            computed dials.
          </p>
        </div>

        <div className="card">
          <h2 className="font-bold mb-2">Next steps</h2>
          <ol className="list-decimal ml-5 space-y-1">
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
    </div>
  );
}
