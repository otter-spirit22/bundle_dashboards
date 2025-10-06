// tailwind.config.cjs (CommonJS)
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0f172a",
        muted: "#475569",
        brand: "#4f46e5",
        accent: "#0ea5e9",
        good: "#10b981",
        warn: "#f59e0b",
        bad: "#ef4444",
        leader: "#6366f1",
      },
    },
  },
  plugins: [],
};
