import { useMemo, useState } from "react";
import Papa, { ParseResult } from "papaparse";

type Row = Record<string, any>;

type Insight = {
  n: number;
  title: string;
  count: string | number;
  badge: "urgent" | "opportunity" | "good" | "warn" | "elite";
  def: string;
};

function pct(n: number, d: number) {
  return d ? Math.round((100 * n) / d) : 0;
}
function percentile(arr: number[], p: number) {
  const clean = arr.filter((x) => x !== null && x !== undefined && !isNaN(x));
  if (!clean.length) return 0;
  clean.sort((a, b) => a - b);
  const idx = Math.floor((p / 100) * clean.length);
  return clean[Math.min(idx, clean.length - 1)];
}
function daysUntil(dateStr?: string) {
  if (!dateStr) return 9999;
  const d = new Date(dateStr);
  return Math.floor((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}
function mean(arr: number[]) {
  const clean = arr.filter((x) => x !== null && x !== undefined && !isNaN(x));
  return clean.length ? clean.reduce((a, b) => a + b, 0) / clean.length : 0;
}
function num(row: Row, col: string, fallback = 0): number {
  const v = row[col];
  if (v === undefined || v === null || v === "") return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}
function str(row: Row, col: string, fallback = ""): string {
  const v = row[col];
  return v === undefined || v === null ? fallback : String(v);
}

export default function Insights50() {
  const [rows, setRows] = useState<Row[]>([]);
  const [fields, setFields] = useState<string[]>([]);
  const [matches, setMatches] = useState<Record<number, Row[]>>({});
  const [modal, setModal] = useState<{ open: boolean; n?: number }>({
    open: false,
  });
  const N = rows.length;

  const onFile = (f: File) => {
    Papa.parse<Row>(f, {
      header: true,
      skipEmptyLines: true,
      complete: (res: ParseResult<Row>) => {
        setRows(res.data);
        setFields(res.meta.fields || []);
      },
      error: (err) => {
        alert(`Parse error: ${String(err)}`);
      },
    });
  };

  const { insights } = useMemo(() => {
    if (!rows.length) return { insights: [] as Insight[] };

    const m: Record<number, Row[]> = {};
    const out: Insight[] = [];

    // --- 1. Bundling Gap
    const bgap = rows.filter(
      (r) =>
        (num(r, "home_flag") === 1 &&
          num(r, "auto_flag") === 1 &&
          str(r, "primary_carrier") !== str(r, "secondary_carrier_optional")) ||
        num(r, "home_flag") + num(r, "auto_flag") === 1
    );
    out.push({
      n: 1,
      title: "Bundling Gap",
      count: bgap.length,
      badge: pct(bgap.length, N) > 25 ? "urgent" : "opportunity",
      def: "HH has home & auto but different carriers, or only one eligible line.",
    });
    m[1] = bgap;

    // --- 2. Coverage Depth Tier
    const shallowHH = rows.filter((r) => num(r, "lines_count") === 1);
    const coreHH = rows.filter((r) => num(r, "lines_count") === 2);
    const deepHH = rows.filter((r) => num(r, "lines_count") >= 3);
    out.push({
      n: 2,
      title: "Coverage Depth Tier",
      count: `${pct(shallowHH.length, N)}% shallow, ${pct(
        coreHH.length,
        N
      )}% core, ${pct(deepHH.length, N)}% deep`,
      badge: "good",
      def: "Classifies HH by lines_count.",
    });
    m[2] = shallowHH; // demo link to shallow

    // --- 3. Umbrella Opportunity
    const umbOpp = rows.filter(
      (r) =>
        num(r, "umbrella_flag") === 0 &&
        (num(r, "home_flag") === 1 || num(r, "auto_flag") === 1) &&
        !str(r, "segment_tier").toLowerCase().includes("bronze")
    );
    out.push({
      n: 3,
      title: "Umbrella Opportunity",
      count: umbOpp.length,
      badge: umbOpp.length > 20 ? "opportunity" : "good",
      def: "Suitable HH without umbrella.",
    });
    m[3] = umbOpp;

    // --- 4. Water Backup Gap
    const wbGap = rows.filter(
      (r) => !r["water_backup_limit"] || num(r, "water_backup_limit") === 0
    );
    out.push({
      n: 4,
      title: "Water Backup Gap",
      count: wbGap.length,
      badge: wbGap.length > 10 ? "urgent" : "good",
      def: "HH lacks water backup coverage.",
    });
    m[4] = wbGap;

    // --- 5. Service Line Gap
    const slGap = rows.filter(
      (r) =>
        !r["service_line_coverage_limit"] ||
        num(r, "service_line_coverage_limit") === 0
    );
    out.push({
      n: 5,
      title: "Service Line Gap",
      count: slGap.length,
      badge: slGap.length > 10 ? "urgent" : "good",
      def: "Missing service line coverage.",
    });
    m[5] = slGap;

    // --- 6. Equipment Breakdown Gap
    const eqGap = rows.filter((r) => num(r, "equipment_breakdown_flag") === 0);
    out.push({
      n: 6,
      title: "Equipment Breakdown Gap",
      count: eqGap.length,
      badge: pct(eqGap.length, N) > 20 ? "urgent" : "good",
      def: "No equipment breakdown endorsement.",
    });
    m[6] = eqGap;

    // --- 7. Roof Upgrade Gap
    const roofGap = rows.filter(
      (r) => num(r, "roof_surfacing_loss_settlement") === 0
    );
    out.push({
      n: 7,
      title: "Roof Upgrade Gap",
      count: roofGap.length,
      badge: roofGap.length > 10 ? "opportunity" : "good",
      def: "Roof upgrade not present where carrier offers.",
    });
    m[7] = roofGap;

    // --- 8. Pet Injury Gap (Auto)
    const petGap = rows.filter(
      (r) => num(r, "auto_flag") === 1 && num(r, "pet_injury_flag") === 0
    );
    const autoCount = rows.filter((r) => num(r, "auto_flag") === 1).length;
    out.push({
      n: 8,
      title: "Pet Injury Gap (Auto)",
      count: `${petGap.length} / ${autoCount}`,
      badge: pct(petGap.length, autoCount) > 15 ? "opportunity" : "good",
      def: "Auto HH without pet injury.",
    });
    m[8] = petGap;

    // --- 9. Key Fob Replacement Gap
    const fobGap = rows.filter((r) => num(r, "key_fob_replacement_flag") === 0);
    out.push({
      n: 9,
      title: "Key Fob Replacement Gap",
      count: fobGap.length,
      badge: fobGap.length > 20 ? "opportunity" : "good",
      def: "HH lacks key fob coverage add-on.",
    });
    m[9] = fobGap;

    // --- 10. Refrigerated Products Coverage Gap
    const fridgeGap = rows.filter(
      (r) =>
        num(r, "refrigerated_products_flag") === 0 ||
        num(r, "refrigerated_products_limit") === 0
    );
    out.push({
      n: 10,
      title: "Refrigerated Products Coverage Gap",
      count: fridgeGap.length,
      badge: fridgeGap.length > 15 ? "opportunity" : "good",
      def: "HH lacks food spoilage coverage.",
    });
    m[10] = fridgeGap;

    // 11–50 (same logic you provided) // 11. Home + Umbrella, No Auto
    const homeUmbNoAuto = rows.filter(
      (r) => num(r, "home_flag") === 1 && num(r, "umbrella_flag") === 1 && num(r, "auto_flag") === 0
    );
    out.push({
      n: 11,
      title: "Home+Umbrella, No Auto",
      count: homeUmbNoAuto.length,
      badge: "opportunity",
      def: "Easy cross-sell to complete classic trio.",
    });
    m[11] = homeUmbNoAuto;
    
    // 12. Auto + Umbrella, No Home
    const autoUmbNoHome = rows.filter(
      (r) => num(r, "auto_flag") === 1 && num(r, "umbrella_flag") === 1 && num(r, "home_flag") === 0
    );
    out.push({
      n: 12,
      title: "Auto+Umbrella, No Home",
      count: autoUmbNoHome.length,
      badge: "opportunity",
      def: "Missing property line.",
    });
    m[12] = autoUmbNoHome;
    
    // 13. High RL Segment (proxy)
    const highRL = rows.filter(
      (r) => (num(r, "remarkets_12m") / (num(r, "remarkets_12m") + 1)) * 100 > 25
    );
    out.push({
      n: 13,
      title: "High RL Segment",
      count: highRL.length,
      badge: pct(highRL.length, N) > 10 ? "urgent" : "good",
      def: "Segment with RL above target.",
    });
    m[13] = highRL;
    
    // 14. Chronic Remarketer HH (placeholder)
    out.push({
      n: 14,
      title: "Chronic Remarketer HH",
      count: "(event log needed)",
      badge: "warn",
      def: "HH remarketed ≥2 of last 3 cycles.",
    });
    m[14] = [];
    
    // 15. Renewal No Review Window  (already in example - remove if duplicate)
    const reviewGap = rows.filter(
      (r) =>
        daysUntil(str(r, "renewal_date")) < 30 &&
        (daysUntil(str(r, "last_reviewed_date")) > 60 || !str(r, "last_reviewed_date"))
    );
    out.push({
      n: 15,
      title: "Renewal No Review Window",
      count: reviewGap.length,
      badge: reviewGap.length > 5 ? "urgent" : "good",
      def: "Renewals in next 30 days without recent review.",
    });
    m[15] = reviewGap;
    
    // 16. Producer Re-shop Outlier (placeholder)
    out.push({
      n: 16,
      title: "Producer Re-shop Outlier",
      count: "(monthly RL needed)",
      badge: "warn",
      def: "Producer with RL >150% agency avg for 2+ months.",
    });
    m[16] = [];
    
    // 17. Carrier Appetite Mismatch
    const carrierRL: Record<string, { count: number; sum: number }> = {};
    rows.forEach((r) => {
      const c = str(r, "primary_carrier");
      if (!carrierRL[c]) carrierRL[c] = { count: 0, sum: 0 };
      carrierRL[c].count += 1;
      carrierRL[c].sum += num(r, "remarkets_12m");
    });
    const agencyRL = mean(rows.map((r) => num(r, "remarkets_12m")));
    const mismatchCarriers = Object.entries(carrierRL)
      .filter(([_, v]) => v.sum / v.count > 1.75 * agencyRL)
      .map(([c]) => c);
    out.push({
      n: 17,
      title: "Carrier Appetite Mismatch",
      count: mismatchCarriers.join(", "),
      badge: mismatchCarriers.length ? "urgent" : "good",
      def: "High RL concentrated on one carrier.",
    });
    m[17] = rows.filter((r) => mismatchCarriers.includes(str(r, "primary_carrier")));
    
    // 18. Late-Bound Renewals (placeholder)
    out.push({
      n: 18,
      title: "Late-Bound Renewals",
      count: "(event log needed)",
      badge: "warn",
      def: "Policies bound within 3 days of renewal.",
    });
    m[18] = [];
    
    // 19. Non-renewal Early Warning
    const earlyWarn = rows.filter(
      (r) => num(r, "churn_risk_score_0_1") >= 0.7 && daysUntil(str(r, "renewal_date")) < 45
    );
    out.push({
      n: 19,
      title: "Non-renewal Early Warning",
      count: earlyWarn.length,
      badge: earlyWarn.length > 5 ? "urgent" : "opportunity",
      def: "HH with high churn risk and upcoming renewal.",
    });
    m[19] = earlyWarn;
    
    // 20. Remarketing Reason Pareto
    const reasonCounts: Record<string, number> = {};
    rows.forEach((r) => {
      const reason = str(r, "remarket_reason");
      reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
    });
    const sortedReasons = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1]);
    const top3Reasons = sortedReasons
      .slice(0, 3)
      .map(([reason, count]) => `${reason}: ${pct(count, N)}%`)
      .join(", ");
    out.push({
      n: 20,
      title: "Remarketing Reason Pareto",
      count: top3Reasons,
      badge: "good",
      def: "Top 3 reasons drive 80% of remarkets.",
    });
    m[20] = rows.filter((r) => top3Reasons.includes(str(r, "remarket_reason")));
    
    // 21. High Minutes HH  (already included earlier - remove if duplicate)
    const serviceMinutes = rows.map(
      (r) => num(r, "service_touches_12m") * num(r, "avg_minutes_per_touch")
    );
    const threshold90 = percentile(serviceMinutes, 90);
    const highMinutesHH = rows.filter((_, i) => serviceMinutes[i] >= threshold90);
    out.push({
      n: 21,
      title: "High Minutes HH",
      count: highMinutesHH.length,
      badge: "urgent",
      def: "HH in top decile of service minutes.",
    });
    m[21] = highMinutesHH;
    
    // 22. Channel Cost Overweight
    const channelMinutes: Record<string, number[]> = {};
    rows.forEach((r) => {
      const ch = str(r, "service_channel");
      if (!channelMinutes[ch]) channelMinutes[ch] = [];
      channelMinutes[ch].push(num(r, "avg_minutes_per_touch"));
    });
    const channelOverweight = Object.entries(channelMinutes).filter(
      ([, minArr]) => mean(minArr) > mean(serviceMinutes)
    );
    out.push({
      n: 22,
      title: "Channel Cost Overweight",
      count: channelOverweight.map((c) => c[0]).join(","),
      badge: channelOverweight.length ? "opportunity" : "good",
      def: "Channel with minutes/touch > benchmark.",
    });
    m[22] = rows.filter((r) =>
      channelOverweight.map((c) => c[0]).includes(str(r, "service_channel"))
    );
    
    // 23. Proof of Insurance Drain (placeholder)
    out.push({
      n: 23,
      title: "Proof of Insurance Drain",
      count: "(event log needed)",
      badge: "warn",
      def: "High minutes on ID card/COI requests.",
    });
    m[23] = [];
    
    // 24. Billing & Payments Time Sink (placeholder)
    out.push({
      n: 24,
      title: "Billing & Payments Time Sink",
      count: "(event log needed)",
      badge: "warn",
      def: "High minutes on billing issues.",
    });
    m[24] = [];
    
    // 25. Claim Follow-up Burden (placeholder)
    out.push({
      n: 25,
      title: "Claim Follow-up Burden",
      count: "(event log needed)",
      badge: "warn",
      def: "Minutes spent on claim follow-ups above threshold.",
    });
    m[25] = [];
    
    // 26. Unbundled Overhead
    const unbundledHH = rows.filter((r) => num(r, "bundled_flag") === 0);
    const unbundledMinutes = mean(
      unbundledHH.map((r) => num(r, "service_touches_12m") * num(r, "avg_minutes_per_touch"))
    );
    out.push({
      n: 26,
      title: "Unbundled Overhead",
      count: `${unbundledMinutes.toFixed(2)} min/HH`,
      badge: unbundledMinutes > 20 ? "opportunity" : "good",
      def: "Extra minutes from cross-carrier admin for splits.",
    });
    m[26] = unbundledHH;
    
    // 27. CSR Load Imbalance (placeholder)
    out.push({
      n: 27,
      title: "CSR Load Imbalance",
      count: "(CSR column/event log needed)",
      badge: "warn",
      def: "One CSR’s book consumes ≥30% more minutes/HH than median.",
    });
    m[27] = [];
    
    // 28. First-Contact Resolution Gap (placeholder)
    out.push({
      n: 28,
      title: "First-Contact Resolution Gap",
      count: "(event log needed)",
      badge: "warn",
      def: "Multi-touch service threads where 1-touch should suffice.",
    });
    m[28] = [];
    
    // 29. AHT Outlier
    const ahtArr = rows.map((r) => num(r, "avg_minutes_per_touch"));
    const ahtP90 = percentile(ahtArr, 90);
    const ahtOutlier = rows.filter((r) => num(r, "avg_minutes_per_touch") >= ahtP90);
    out.push({
      n: 29,
      title: "AHT Outlier",
      count: ahtOutlier.length,
      badge: ahtOutlier.length > 10 ? "opportunity" : "good",
      def: "AHT (avg min/touch) in top decile.",
    });
    m[29] = ahtOutlier;
    
    // 30. Self-Service Uptake
    const channelMix: Record<string, number> = {};
    rows.forEach((r) => {
      const ch = str(r, "service_channel");
      channelMix[ch] = (channelMix[ch] || 0) + 1;
    });
    const portalShare = pct(channelMix["Portal"] || 0, N);
    out.push({
      n: 30,
      title: "Self-Service Uptake",
      count: `Portal: ${portalShare}%`,
      badge: portalShare < 25 ? "opportunity" : "good",
      def: "Share of portal/email vs phone.",
    });
    m[30] = rows.filter((r) => str(r, "service_channel") !== "Portal");
    
    // 31. Tenure Momentum Negative
    const tenureArr = rows.map((r) => num(r, "tenure_years"));
    const tenureMomentum =
      tenureArr.reduce((a, b) => a + b, 0) / (N || 1) -
      (tenureArr.slice(1).reduce((a, b) => a + b, 0) / Math.max(N - 1, 1));
    out.push({
      n: 31,
      title: "Tenure Momentum Negative",
      count: tenureMomentum < 0 ? "Negative" : "Positive",
      badge: tenureMomentum < 0 ? "urgent" : "good",
      def: "MoM avg tenure decreasing.",
    });
    m[31] = tenureMomentum < 0 ? rows : [];
    
    // 32. Low Tenure, High Depth Risk
    const lowTenureHighDepth = rows.filter(
      (r) => num(r, "tenure_years") < 2 && num(r, "lines_count") >= 2 && num(r, "churn_risk_score_0_1") >= 0.6
    );
    out.push({
      n: 32,
      title: "Low Tenure, High Depth Risk",
      count: lowTenureHighDepth.length,
      badge: lowTenureHighDepth.length > 5 ? "urgent" : "good",
      def: "Newer HH with ≥2 lines but high churn risk.",
    });
    m[32] = lowTenureHighDepth;
    
    // 33. Retention Weak Signal
    const notRetained = rows.filter((r) => num(r, "retained_last_term_flag") === 0);
    out.push({
      n: 33,
      title: "Retention Weak Signal",
      count: `${pct(notRetained.length, N)}% not retained`,
      badge: pct(notRetained.length, N) > 10 ? "urgent" : "good",
      def: "Prior term not retained.",
    });
    m[33] = notRetained;
    
    // 34. Claims Backlog
    const claimBacklog = mean(rows.map((r) => num(r, "claims_open_count")));
    const highClaimBacklog = rows.filter((r) => num(r, "claims_open_count") > 0.2);
    out.push({
      n: 34,
      title: "Claims Backlog",
      count: `${claimBacklog.toFixed(2)} open claims/HH`,
      badge: claimBacklog > 0.2 ? "urgent" : "good",
      def: "Open claims per HH exceeds threshold.",
    });
    m[34] = highClaimBacklog;
    
    // 35. High Claim Frequency Cohort
    const segClaimClosed: Record<string, number[]> = {};
    rows.forEach((r) => {
      const seg = str(r, "segment_tier");
      if (!segClaimClosed[seg]) segClaimClosed[seg] = [];
      segClaimClosed[seg].push(num(r, "claims_closed_12m"));
    });
    const cohortHigh = Object.entries(segClaimClosed)
      .filter(([_, arr]) => mean(arr) > 1.5 * mean(rows.map((r) => num(r, "claims_closed_12m"))))
      .map(([seg]) => seg);
    out.push({
      n: 35,
      title: "High Claim Frequency Cohort",
      count: cohortHigh.join(", "),
      badge: cohortHigh.length ? "opportunity" : "good",
      def: "Segment w/ higher claims_closed_12m/HH.",
    });
    m[35] = rows.filter((r) => cohortHigh.includes(str(r, "segment_tier")));
    
    // 36. Experience Quality Dip
    const eqDip =
      mean(rows.map((r) => num(r, "claims_open_count"))) >
      mean(rows.map((r) => num(r, "claims_closed_12m")));
    out.push({
      n: 36,
      title: "Experience Quality Dip",
      count: eqDip ? "Dip" : "Stable",
      badge: eqDip ? "urgent" : "good",
      def: "EQ proxy falling (open claims up, closed claims down).",
    });
    m[36] = eqDip ? rows : [];
    
    // 37. Review Freshness Gap
    const staleDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    const reviewStale = rows.filter(
      (r) => !str(r, "last_reviewed_date") || new Date(str(r, "last_reviewed_date")) < staleDate
    );
    out.push({
      n: 37,
      title: "Review Freshness Gap",
      count: reviewStale.length,
      badge: reviewStale.length > 20 ? "urgent" : "good",
      def: "HH not reviewed in > 12 months.",
    });
    m[37] = reviewStale;
    
    // 38. Churn Risk Hot List
    const churnArr = rows.map((r) => num(r, "churn_risk_score_0_1"));
    const churnP90 = percentile(churnArr, 90);
    const churnHot = rows.filter(
      (r) => num(r, "churn_risk_score_0_1") >= churnP90 && daysUntil(str(r, "renewal_date")) < 60
    );
    out.push({
      n: 38,
      title: "Churn Risk Hot List",
      count: churnHot.length,
      badge: churnHot.length > 10 ? "urgent" : "good",
      def: "Top decile churn risk approaching renewal.",
    });
    m[38] = churnHot;
    
    // 39. Account Value Underweighted
    const premiumArr = rows.map((r) => num(r, "written_premium_total"));
    const premiumP75 = percentile(premiumArr, 75);
    const underweighted = rows.filter(
      (r) => num(r, "written_premium_total") >= premiumP75 && num(r, "lines_count") === 1
    );
    out.push({
      n: 39,
      title: "Account Value Underweighted",
      count: underweighted.length,
      badge: underweighted.length > 10 ? "opportunity" : "good",
      def: "High premium accounts with shallow depth.",
    });
    m[39] = underweighted;
    
    // 40. Commission Efficiency
    const commArr = rows.map((r) => {
      const commission = num(r, "written_premium_total") * (num(r, "commission_rate_pct") / 100);
      const minutes = num(r, "service_touches_12m") * Math.max(num(r, "avg_minutes_per_touch"), 0.0001);
      return commission / minutes;
    });
    const commEff = mean(commArr);
    out.push({
      n: 40,
      title: "Commission Efficiency",
      count: `$${commEff.toFixed(2)} per minute`,
      badge: commEff < 2 ? "warn" : "good",
      def: "Commission per service minute.",
    });
    m[40] = rows.filter((r) => {
      const commission = num(r, "written_premium_total") * (num(r, "commission_rate_pct") / 100);
      const minutes = num(r, "service_touches_12m") * Math.max(num(r, "avg_minutes_per_touch"), 0.0001);
      return commission / minutes < 2;
    });
    
    // 41. Remarketing ROI
    const roiHH = rows.filter(
      (r) => num(r, "est_minutes_per_remarket") * 1.25 > num(r, "written_premium_total") * 0.01
    );
    out.push({
      n: 41,
      title: "Remarketing ROI",
      count: roiHH.length,
      badge: roiHH.length > 10 ? "opportunity" : "good",
      def: "Net gain from remarkets vs time spent.",
    });
    m[41] = roiHH;
    
    // 42. Discount Leakage
    const discountLeak = rows.filter(
      (r) => num(r, "bundle_discount_flag") === 0 || num(r, "safe_driver_flag") === 0
    );
    out.push({
      n: 42,
      title: "Discount Leakage",
      count: discountLeak.length,
      badge: discountLeak.length > 10 ? "opportunity" : "good",
      def: "Eligible discounts not applied.",
    });
    m[42] = discountLeak;
    
    // 43. Carrier Mix Concentration
    const carrierArr: Record<string, number> = {};
    rows.forEach((r) => {
      const c = str(r, "primary_carrier");
      carrierArr[c] = (carrierArr[c] || 0) + 1;
    });
    const carrierMix = Object.entries(carrierArr)
      .filter(([_, n]) => pct(n, N) > 45)
      .map(([c]) => c);
    out.push({
      n: 43,
      title: "Carrier Mix Concentration",
      count: carrierMix.join(", "),
      badge: carrierMix.length ? "warn" : "good",
      def: "Over-reliance on one carrier > 45%.",
    });
    m[43] = rows.filter((r) => carrierMix.includes(str(r, "primary_carrier")));
    
    // 44. Rate Shock Sensitivity
    const rateShock = rows.filter(
      (r) =>
        (num(r, "churn_risk_score_0_1") >= 0.6 || num(r, "remarkets_12m") >= 1) &&
        daysUntil(str(r, "renewal_date")) < 60
    );
    out.push({
      n: 44,
      title: "Rate Shock Sensitivity",
      count: rateShock.length,
      badge: rateShock.length > 10 ? "urgent" : "good",
      def: "Accounts with high rate-change likelihood.",
    });
    m[44] = rateShock;
    
    // 45. Producer Depth Delta (placeholder)
    out.push({
      n: 45,
      title: "Producer Depth Delta",
      count: "(producer column needed)",
      badge: "warn",
      def: "Producer’s depth vs agency average.",
    });
    m[45] = [];
    
    // 46. Producer TBN Opportunity (placeholder)
    out.push({
      n: 46,
      title: "Producer TBN Opportunity",
      count: "(producer column needed)",
      badge: "warn",
      def: "Hours reclaimable from Top-N splits.",
    });
    m[46] = [];
    
    // 47. Office RL Outlier
    const officeRL: Record<string, { count: number; sum: number }> = {};
    rows.forEach((r) => {
      const o = str(r, "office_location");
      if (!officeRL[o]) officeRL[o] = { count: 0, sum: 0 };
      officeRL[o].count += 1;
      officeRL[o].sum += num(r, "remarkets_12m");
    });
    const officeRLAvg = mean(rows.map((r) => num(r, "remarkets_12m")));
    const officeRLout = Object.entries(officeRL)
      .filter(([_, v]) => v.sum / v.count > 1.5 * officeRLAvg)
      .map(([o]) => o);
    out.push({
      n: 47,
      title: "Office RL Outlier",
      count: officeRLout.join(", "),
      badge: officeRLout.length ? "warn" : "good",
      def: "Office RL exceeds agency by 50%+ for 2 months.",
    });
    m[47] = rows.filter((r) => officeRLout.includes(str(r, "office_location")));
    
    // 48. Win Rate After Outreach (placeholder)
    out.push({
      n: 48,
      title: "Win Rate After Outreach",
      count: "(event log needed)",
      badge: "warn",
      def: "Conversion after Top-N outreach.",
    });
    m[48] = [];
    
    // 49. Data Confidence Gap
    const confidenceGap = rows.filter(
      (r) =>
        num(r, "data_confidence", 1) < 0.7 ||
        !str(r, "renewal_date") ||
        !num(r, "lines_count") ||
        !num(r, "avg_minutes_per_touch")
    );
    out.push({
      n: 49,
      title: "Data Confidence Gap",
      count: confidenceGap.length,
      badge: confidenceGap.length > 5 ? "warn" : "good",
      def: "Rows with data_confidence below threshold or key nulls.",
    });
    m[49] = confidenceGap;
    
    const requiredCols = [
      "household_id",
      "tenure_years",
      "lines_count",
      "bundled_flag",
      "renewal_date",
      "service_touches_12m",
      "avg_minutes_per_touch",
      "remarkets_12m",
      "est_minutes_per_remarket",
    ];
    const missing = requiredCols.filter((c) => !fields.includes(c));
    out.push({
      n: 50,
      title: "Template Compliance",
      count: missing.length ? `Missing: ${missing.join(", ")}` : "PASS",
      badge: missing.length ? "urgent" : "good",
      def: "Missing required headers or invalid types.",
    });
    m[50] = [];


    const reviewGap = rows.filter(
      (r) =>
        daysUntil(str(r, "renewal_date")) < 30 &&
        (daysUntil(str(r, "last_reviewed_date")) > 60 ||
          !str(r, "last_reviewed_date"))
    );
    out.push({
      n: 15,
      title: "Renewal No Review Window",
      count: reviewGap.length,
      badge: reviewGap.length > 5 ? "urgent" : "good",
      def: "Renewals in next 30 days without recent review.",
    });
    m[15] = reviewGap;

    // 21. High Minutes HH (decile example)
    const serviceMinutes = rows.map(
      (r) => num(r, "service_touches_12m") * num(r, "avg_minutes_per_touch")
    );
    const threshold90 = percentile(serviceMinutes, 90);
    const highMinutesHH = rows.filter(
      (_r, i) => serviceMinutes[i] >= threshold90
    );
    out.push({
      n: 21,
      title: "High Minutes HH",
      count: highMinutesHH.length,
      badge: "urgent",
      def: "HH in top decile of service minutes.",
    });
    m[21] = highMinutesHH;

    // 50. Template Compliance
    const required = [
      "household_id",
      "tenure_years",
      "lines_count",
      "bundled_flag",
      "renewal_date",
      "service_touches_12m",
      "avg_minutes_per_touch",
      "remarkets_12m",
      "est_minutes_per_remarket",
    ];
    const missing = required.filter((c) => !fields.includes(c));
    out.push({
      n: 50,
      title: "Template Compliance",
      count: missing.length ? `Missing: ${missing.join(", ")}` : "PASS",
      badge: missing.length ? "urgent" : "good",
      def: "Missing required headers or invalid types.",
    });
    m[50] = [];

    setMatches(m);
    return { insights: out };
  }, [rows, fields, N]);

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-indigo-300">
          Compute 50 BundleBench Insights
        </h1>
        <label className="badge border-white/20 cursor-pointer">
          <input
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => e.target.files && onFile(e.target.files[0])}
          />
          Upload CSV
        </label>
      </header>

      {rows.length === 0 ? (
        <div className="card">
          <p className="text-slate-300">
            Choose a CSV to calculate insights. You can export from your AMS or
            use our template.
          </p>
        </div>
      ) : (
        <>
          <div className="card">
            <b>Loaded {N} households. </b>
            <span className="badge bg-green-500/30 border-green-400/30">
              Insights computed!
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-separate border-spacing-0">
              <thead>
                <tr className="[&>th]:text-left [&>th]:p-3 [&>th]:bg-white/5">
                  <th className="rounded-l-xl">#</th>
                  <th>Title</th>
                  <th>Count / Value</th>
                  <th>Badge</th>
                  <th className="rounded-r-xl">Definition</th>
                </tr>
              </thead>
              <tbody>
                {insights.map((ins) => {
                  const badgeClass =
                    ins.badge === "urgent"
                      ? "bg-red-500/30 border-red-400/40"
                      : ins.badge === "opportunity"
                      ? "bg-indigo-500/30 border-indigo-400/40"
                      : ins.badge === "warn"
                      ? "bg-yellow-500/30 border-yellow-400/40"
                      : ins.badge === "elite"
                      ? "bg-indigo-400/30 border-indigo-300/40"
                      : "bg-emerald-500/30 border-emerald-400/40";

                  return (
                    <tr
                      key={ins.n}
                      className="[&>td]:p-3 border-b border-white/10"
                    >
                      <td>{ins.n}</td>
                      <td>
                        <button
                          className="underline decoration-dotted hover:opacity-80"
                          onClick={() => setModal({ open: true, n: ins.n })}
                        >
                          {ins.title}
                        </button>
                      </td>
                      <td>{ins.count}</td>
                      <td>
                        <span
                          className={`badge border ${badgeClass} text-white/90`}
                        >
                          {ins.badge}
                        </span>
                      </td>
                      <td className="text-slate-300">{ins.def}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Modal */}
          {modal.open && (
            <div
              className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4"
              onClick={() => setModal({ open: false })}
            >
              <div
                className="bg-slate-900 text-slate-100 rounded-2xl shadow-2xl w-full max-w-3xl p-6 border border-white/10"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-semibold">
                    Accounts for Insight #{modal.n}
                  </h2>
                  <button
                    className="text-xl leading-none hover:opacity-80"
                    onClick={() => setModal({ open: false })}
                  >
                    ×
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="[&>th]:text-left [&>th]:p-2 bg-white/5">
                        <th>Renewal Date</th>
                        <th>Name</th>
                        <th>Email</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(matches[modal.n || 0] || []).map((r, i) => (
                        <tr key={i} className="[&>td]:p-2 border-b border-white/10">
                          <td>{str(r, "renewal_date", "-")}</td>
                          <td>{str(r, "name", "-")}</td>
                          <td>{str(r, "email", "-")}</td>
                        </tr>
                      ))}
                      {(!matches[modal.n || 0] ||
                        matches[modal.n || 0].length === 0) && (
                        <tr className="[&>td]:p-2">
                          <td colSpan={3} className="text-slate-300">
                            No matching accounts found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
