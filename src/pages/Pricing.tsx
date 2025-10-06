export default function Pricing() {
  return (
    <div className="mx-auto max-w-5xl p-6 space-y-6">
      <h1 className="text-2xl font-extrabold text-indigo-300">Pricing</h1>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="card">
          <h3 className="font-semibold">Starter</h3>
          <div className="kpi mt-1">$0</div>
          <p className="text-sm text-slate-300">Upload + core dials + PDF export</p>
        </div>
        <div className="card border-indigo-400/40">
          <h3 className="font-semibold">Pro</h3>
          <div className="kpi mt-1">
            $149<span className="text-base font-bold">/mo</span>
          </div>
          <ul className="list-disc ml-5 text-sm text-slate-300 space-y-1">
            <li>BenchScore™ & Time-Back Number™</li>
            <li>Insights Library + Top-N plan</li>
            <li>Email export & branding</li>
          </ul>
        </div>
        <div className="card">
          <h3 className="font-semibold">Enterprise</h3>
          <div className="kpi mt-1">Let’s talk</div>
          <p className="text-sm text-slate-300">Multi-office, SSO, roadmap influence</p>
        </div>
      </div>
    </div>
  );
}
