# Bundle Bench — Role Dashboards (Demo-Ready)

See /principal, /producer, /account-manager. Upload CSV/XLSX from the top nav.

## Install
```bash
npm i
npm run dev
```

## Applying the latest fixes to your deployed site

1. Pull the updated code that already includes the dependency and type fixes:
   ```bash
   git pull
   ```
2. Install the refreshed dependency set locally (or on your host):
   ```bash
   npm install
   ```
3. Run the TypeScript check or build to make sure everything compiles before you deploy:
   ```bash
   npm run type-check
   # or
   npm run build
   ```
4. Redeploy or restart your hosting environment so it serves the freshly built assets.

These steps ensure your site picks up the new packages (`clsx`, `html2canvas`, `jspdf`, and
others) and the code changes that rely on them.
