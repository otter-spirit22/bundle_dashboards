export default function About() {
  return (
    <div className="mx-auto max-w-5xl p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold text-indigo-300">About Bundle Bench</h1>
        <p className="text-slate-300 mt-1">
          We help independent agencies see, quantify, and reclaim time by turning book data into five
          simple dials: Coverage Depth, Remarketing Load, Service Touch Index, Tenure Momentum,
          and BenchScore™.
        </p>
      </header>

      <section className="card">
        <h2 className="font-semibold mb-2">Our POV</h2>
        <p className="text-sm text-slate-300">
          Most dashboards measure activity. We measure <em>drag</em> (minutes, remarkets, fragmentation)
          and show where bundling changes the math. It’s a planning tool first—then a scoreboard.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          {title:'Fast setup',body:'Upload CSV/XLSX and see dials in under a minute.'},
          {title:'Book-first insights',body:'Surface Top-N time drains and bundle candidates instantly.'},
          {title:'Actionable exports',body:'One-click PDF snapshot for team standups and renewals.'},
        ].map((c,i)=>(
          <div key={i} className="card">
            <h3 className="font-semibold">{c.title}</h3>
            <p className="text-sm text-slate-300 mt-1">{c.body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
