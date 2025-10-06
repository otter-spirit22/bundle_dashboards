import { useState } from "react";

export default function Accordion({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="space-y-2">
      {items.map((it, i) => (
        <div key={i} className="card">
          <button className="w-full text-left" onClick={() => setOpen(open === i ? null : i)}>
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">{it.q}</h4>
              <span className="badge border-white/10">{open === i ? "−" : "+"}</span>
            </div>
          </button>
          {open === i && <p className="mt-2 text-sm text-slate-300">{it.a}</p>}
        </div>
      ))}
    </div>
  );
}
