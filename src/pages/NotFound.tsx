// src/pages/NotFound.tsx
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-3xl p-8">
      <h1 className="mb-2 text-2xl font-extrabold text-indigo-300">Page not found</h1>
      <p className="text-slate-400">The page you’re looking for doesn’t exist.</p>
      <div className="mt-4">
        <Link to="/" className="badge border-white/20">← Back home</Link>
      </div>
    </div>
  );
}
