import React, { useMemo, useRef, useState } from "react";
import Papa from "papaparse";

/** ---------- Helpers & Types ---------- */
type Row = Record<string, any>;
type Insight = { n: number; title: string; count: string | number; badge: "urgent"|"opportunity"|"good"|"warn"|string; def: string };

const REQUIRED_COLS = [
  "household_id","tenure_years","lines_count","bundled_flag","renewal_date",
  "service_touches_12m","avg_minutes_per_touch","remarkets_12m","est_minutes_per_remarket"
];

const pct = (n: number, d: number) => (d ? Math.round((100 * n) / d) : 0);
const percentile = (arr: number[], p: number) => {
  const xs = arr.filter((x) => x !== null && x !== undefined && !isNaN(x)).slice().sort((a,b)=>a-b);
  if (!xs.length) return 0;
  const idx = Math.floor((p / 100) * (xs.length - 1));
  return xs[idx];
};
const daysUntil = (dateStr?: string) => {
  if (!dateStr) return 999999;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 999999;
  return Math.floor((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
};
const mean = (arr: number[]) => {
  const xs = arr.filter((x) => x !== null && x !== undefined && !isNaN(x));
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
};
const num = (row: Row, col: string, fallback = 0) => {
  const v = row[col];
  const n = Number(v);
  return isNaN(n) ? fallback : n;
};
const str = (row: Row, col: string, fallback = "") => {
  const v = row[col];
  return v === undefined || v === null ? fallback : String(v);
};

function exportRowsToCsv(rows: Row[], filename = "insight_rows.csv") {
  if (!rows || !rows.length) return;
  const headers = Array.from(
    rows.reduce<Set<string>>((s, r) => {
      Object.keys(r || {}).forEach((k) => s.add(k));
      return s;
    }, new Set())
  );
  const csv = [
    headers.join(","),
    ...rows.map((r) =>
      headers
        .map((h) => {
          const cell = r[h] ?? "";
          const s = String(cell).replace(/"/g, '""');
          return /[",\n]/.test(s) ? `"${s}"` : s;
        })
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/** ---------- Component ---------- */
export default function Insights50() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [fields, setFields] = useState<string[]>([]);
  const [missingCols, setMissingCols] = useState<string[]>([]);
  const [matches, setMatches] = useState<Record<number, Row[]>>({});
  const [modal, setModal] = useState<{ open: boolean; insight?: number }>({ open: false });

  const N = rows.length;

  const insights: Insight[] = useMemo(() => {
    if (!rows.length) return [];
    const insights: Insight[] = [];
    const m: Record<number, Row[]> = {};

    // 1. Bundling Gap
    const bgap = rows.filter(row =>
      (num(row,'home_flag')===1 && num(row,'auto_flag')===1 && str(row,'primary_carrier')!==str(row,'secondary_carrier_optional')) ||
      (num(row,'home_flag') + num(row,'auto_flag') === 1)
    );
    insights.push({n:1, title:'Bundling Gap', count:bgap.length, badge:pct(bgap.length,N)>25?'urgent':'opportunity', def:'HH has home & auto but different carriers, or only one eligible line.'});
    m[1] = bgap;

    // 2. Coverage Depth Tier
    const shallowHH = rows.filter(row=>num(row,'lines_count')===1);
    const coreHH    = rows.filter(row=>num(row,'lines_count')===2);
    const deepHH    = rows.filter(row=>num(row,'lines_count')>=3);
    insights.push({n:2, title:'Coverage Depth Tier', count:`${pct(shallowHH.length,N)}% shallow, ${pct(coreHH.length,N)}% core, ${pct(deepHH.length,N)}% deep`, badge:'good', def:'Classifies HH by lines_count.'});
    m[2] = shallowHH;

    // 3. Umbrella Opportunity
    const umbOpp = rows.filter(row=>num(row,'umbrella_flag')===0 && (num(row,'home_flag')===1||num(row,'auto_flag')===1) && !str(row,'segment_tier').toLowerCase().includes('bronze'));
    insights.push({n:3, title:'Umbrella Opportunity', count:umbOpp.length, badge:umbOpp.length>20?'opportunity':'good', def:'Suitable HH without umbrella.'});
    m[3] = umbOpp;

    // 4. Water Backup Gap
    const wbGap = rows.filter(row=>num(row,'water_backup_limit',0)===0);
    insights.push({n:4, title:'Water Backup Gap', count:wbGap.length, badge:wbGap.length>10?'urgent':'good', def:'HH lacks water backup coverage.'});
    m[4] = wbGap;

    // 5. Service Line Gap
    const slGap = rows.filter(row=>num(row,'service_line_coverage_limit',0)===0);
    insights.push({n:5, title:'Service Line Gap', count:slGap.length, badge:slGap.length>10?'urgent':'good', def:'Missing service line coverage.'});
    m[5] = slGap;

    // 6. Equipment Breakdown Gap
    const eqGap = rows.filter(row=>num(row,'equipment_breakdown_flag')===0);
    insights.push({n:6, title:'Equipment Breakdown Gap', count:eqGap.length, badge:pct(eqGap.length,N)>20?'urgent':'good', def:'No equipment breakdown endorsement.'});
    m[6] = eqGap;

    // 7. Roof Upgrade Gap
    const roofGap = rows.filter(row=>num(row,'roof_surfacing_loss_settlement')===0);
    insights.push({n:7, title:'Roof Upgrade Gap', count:roofGap.length, badge:roofGap.length>10?'opportunity':'good', def:'Roof upgrade not present where carrier offers.'});
    m[7] = roofGap;

    // 8. Pet Injury Gap (Auto)
    const petGap = rows.filter(row=>num(row,'auto_flag')===1 && num(row,'pet_injury_flag')===0);
    const autoCount = rows.filter(row=>num(row,'auto_flag')===1).length;
    insights.push({n:8, title:'Pet Injury Gap (Auto)', count:`${petGap.length} / ${autoCount}`, badge:pct(petGap.length,autoCount)>15?'opportunity':'good', def:'Auto HH without pet injury.'});
    m[8] = petGap;

    // 9. Key Fob Replacement Gap
    const fobGap = rows.filter(row=>num(row,'key_fob_replacement_flag')===0);
    insights.push({n:9, title:'Key Fob Replacement Gap', count:fobGap.length, badge:fobGap.length>20?'opportunity':'good', def:'HH lacks key fob coverage add-on.'});
    m[9] = fobGap;

    // 10. Refrigerated Products Coverage Gap
    const fridgeGap = rows.filter(row=>num(row,'refrigerated_products_flag')===0 || num(row,'refrigerated_products_limit')===0);
    insights.push({n:10, title:'Refrigerated Products Coverage Gap', count:fridgeGap.length, badge:fridgeGap.length>15?'opportunity':'good', def:'HH lacks food spoilage coverage.'});
    m[10] = fridgeGap;

    // 11. Home + Umbrella, No Auto
    const homeUmbNoAuto = rows.filter(row=>num(row,'home_flag')===1 && num(row,'umbrella_flag')===1 && num(row,'auto_flag')===0);
    insights.push({n:11, title:'Home+Umbrella, No Auto', count:homeUmbNoAuto.length, badge:'opportunity', def:'Easy cross-sell to complete classic trio.'});
    m[11] = homeUmbNoAuto;

    // 12. Auto + Umbrella, No Home
    const autoUmbNoHome = rows.filter(row=>num(row,'auto_flag')===1 && num(row,'umbrella_flag')===1 && num(row,'home_flag')===0);
    insights.push({n:12, title:'Auto+Umbrella, No Home', count:autoUmbNoHome.length, badge:'opportunity', def:'Missing property line.'});
    m[12] = autoUmbNoHome;

    // 13. High RL Segment
    const highRL = rows.filter(row=> (num(row,'remarkets_12m')/(num(row,'remarkets_12m')+1))*100 > 25);
    insights.push({n:13, title:'High RL Segment', count:highRL.length, badge:pct(highRL.length,N)>10?'urgent':'good', def:'Segment with RL above target.'});
    m[13] = highRL;

    // 14. Chronic Remarketer HH (placeholder)
    insights.push({n:14, title:'Chronic Remarketer HH', count:'(event log needed)', badge:'warn', def:'HH remarketed ≥2 of last 3 cycles.'});
    m[14] = [];

    // 15. Renewal No Review Window
    const reviewGap = rows.filter(row=>daysUntil(str(row,'renewal_date'))<30 && (daysUntil(str(row,'last_reviewed_date'))>60 || !str(row,'last_reviewed_date')));
    insights.push({n:15, title:'Renewal No Review Window', count:reviewGap.length, badge:reviewGap.length>5?'urgent':'good', def:'Renewals in next 30 days without recent review.'});
    m[15] = reviewGap;

    // 16. Producer Re-shop Outlier (placeholder)
    insights.push({n:16, title:'Producer Re-shop Outlier', count:'(monthly RL needed)', badge:'warn', def:'Producer with RL >150% agency avg for 2+ months.'});
    m[16] = [];

    // 17. Carrier Appetite Mismatch
    const carrierRL: Record<string,{count:number;sum:number}> = {};
    rows.forEach(row=>{
      const c = str(row,'primary_carrier');
      (carrierRL[c] = carrierRL[c] || {count:0,sum:0});
      carrierRL[c].count++;
      carrierRL[c].sum += num(row,'remarkets_12m');
    });
    const agencyRL = mean(rows.map(row=>num(row,'remarkets_12m')));
    const mismatchCarriers = Object.entries(carrierRL).filter(([_,val])=> val.sum/val.count > 1.75*agencyRL).map(([c])=>c);
    insights.push({n:17, title:'Carrier Appetite Mismatch', count:mismatchCarriers.join(', '), badge:mismatchCarriers.length?'urgent':'good', def:'High RL concentrated on one carrier.'});
    m[17] = rows.filter(row=>mismatchCarriers.includes(str(row,'primary_carrier')));

    // 18. Late-Bound Renewals (placeholder)
    insights.push({n:18, title:'Late-Bound Renewals', count:'(event log needed)', badge:'warn', def:'Policies bound within 3 days of renewal.'});
    m[18] = [];

    // 19. Non-renewal Early Warning
    const earlyWarn = rows.filter(row=>num(row,'churn_risk_score_0_1')>=0.7 && daysUntil(str(row,'renewal_date'))<45);
    insights.push({n:19, title:'Non-renewal Early Warning', count:earlyWarn.length, badge:earlyWarn.length>5?'urgent':'opportunity', def:'HH with high churn risk and upcoming renewal.'});
    m[19] = earlyWarn;

    // 20. Remarketing Reason Pareto
    const reasonCounts: Record<string,number> = {};
    rows.forEach(row=>{
      const reason = str(row,'remarket_reason');
      reasonCounts[reason] = (reasonCounts[reason]||0)+1;
    });
    const sortedReasons = Object.entries(reasonCounts).sort((a,b)=>b[1]-a[1]);
    const top3Reasons = sortedReasons.slice(0,3).map(([reason,count])=>`${reason}: ${pct(count,N)}%`).join(', ');
    insights.push({n:20, title:'Remarketing Reason Pareto', count:top3Reasons, badge:'good', def:'Top 3 reasons drive 80% of remarkets.'});
    m[20] = rows.filter(row=>top3Reasons.includes(str(row,'remarket_reason')));

    // 21. High Minutes HH
    const serviceMinutes = rows.map(row=> num(row,'service_touches_12m') * num(row,'avg_minutes_per_touch'));
    const threshold90 = percentile(serviceMinutes,90);
    const highMinutesHH = rows.filter((row,i)=>serviceMinutes[i] >= threshold90);
    insights.push({n:21, title:'High Minutes HH', count:highMinutesHH.length, badge:'urgent', def:'HH in top decile of service minutes.'});
    m[21] = highMinutesHH;

    // 22. Channel Cost Overweight
    const channelMinutes: Record<string, number[]> = {};
    rows.forEach(row=>{
      const ch = str(row,'service_channel');
      (channelMinutes[ch] = channelMinutes[ch] || []).push(num(row,'avg_minutes_per_touch'));
    });
    const channelOverweight = Object.entries(channelMinutes).filter(([_,minArr])=> mean(minArr) > mean(serviceMinutes));
    insights.push({n:22, title:'Channel Cost Overweight', count:channelOverweight.map(c=>c[0]).join(','), badge:channelOverweight.length?'opportunity':'good', def:'Channel with minutes/touch > benchmark.'});
    m[22] = rows.filter(row=> channelOverweight.map(c=>c[0]).includes(str(row,'service_channel')));

    // 23. Proof of Insurance Drain (placeholder)
    insights.push({n:23, title:'Proof of Insurance Drain', count:'(event log needed)', badge:'warn', def:'High minutes on ID card/COI requests.'});
    m[23] = [];

    // 24. Billing & Payments Time Sink (placeholder)
    insights.push({n:24, title:'Billing & Payments Time Sink', count:'(event log needed)', badge:'warn', def:'High minutes on billing issues.'});
    m[24] = [];

    // 25. Claim Follow-up Burden (placeholder)
    insights.push({n:25, title:'Claim Follow-up Burden', count:'(event log needed)', badge:'warn', def:'Minutes spent on claim follow-ups above threshold.'});
    m[25] = [];

    // 26. Unbundled Overhead
    const unbundledHH = rows.filter(row=>num(row,'bundled_flag')===0);
    const unbundledMinutes = mean(unbundledHH.map(row=> num(row,'service_touches_12m') * num(row,'avg_minutes_per_touch')));
    insights.push({n:26, title:'Unbundled Overhead', count:unbundledMinutes.toFixed(2)+' min/HH', badge:unbundledMinutes>20?'opportunity':'good', def:'Extra minutes from cross-carrier admin for splits.'});
    m[26] = unbundledHH;

    // 27. CSR Load Imbalance (placeholder)
    insights.push({n:27, title:'CSR Load Imbalance', count:'(CSR column/event log needed)', badge:'warn', def:'One CSR’s book consumes ≥30% more minutes/HH than median.'});
    m[27] = [];

    // 28. First-Contact Resolution Gap (placeholder)
    insights.push({n:28, title:'First-Contact Resolution Gap', count:'(event log needed)', badge:'warn', def:'Multi-touch service threads where 1-touch should suffice.'});
    m[28] = [];

    // 29. AHT Outlier
    const ahtArr = rows.map(row=>num(row,'avg_minutes_per_touch'));
    const ahtP90 = percentile(ahtArr,90);
    const ahtOutlier = rows.filter(row=>num(row,'avg_minutes_per_touch')>=ahtP90);
    insights.push({n:29, title:'AHT Outlier', count:ahtOutlier.length, badge:ahtOutlier.length>10?'opportunity':'good', def:'AHT (avg min/touch) in top decile.'});
    m[29] = ahtOutlier;

    // 30. Self-Service Uptake
    const channelMix: Record<string, number> = {};
    rows.forEach(row=> channelMix[str(row,'service_channel')] = (channelMix[str(row,'service_channel')] || 0) + 1);
    const portalShare = pct(channelMix["Portal"]||0, N);
    insights.push({n:30, title:'Self-Service Uptake', count:`Portal: ${portalShare}%`, badge:portalShare<25?'opportunity':'good', def:'Share of portal/email vs phone.'});
    m[30] = rows.filter(row=>str(row,'service_channel')!=="Portal");

    // 31. Tenure Momentum Negative
    const tenureArr = rows.map(row=>num(row,'tenure_years'));
    const tenureMomentum = (tenureArr.reduce((a,b)=>a+b,0)/(N||1)) - (tenureArr.slice(1).reduce((a,b)=>a+b,0)/Math.max(N-1,1));
    insights.push({n:31, title:'Tenure Momentum Negative', count:tenureMomentum<0?'Negative':'Positive', badge:tenureMomentum<0?'urgent':'good', def:'MoM avg tenure decreasing.'});
    m[31] = tenureMomentum<0 ? rows : [];

    // 32. Low Tenure, High Depth Risk
    const lowTenureHighDepth = rows.filter(row=> num(row,'tenure_years')<2 && num(row,'lines_count')>=2 && num(row,'churn_risk_score_0_1')>=0.6 );
    insights.push({n:32, title:'Low Tenure, High Depth Risk', count:lowTenureHighDepth.length, badge:lowTenureHighDepth.length>5?'urgent':'good', def:'Newer HH with ≥2 lines but high churn risk.'});
    m[32] = lowTenureHighDepth;

    // 33. Retention Weak Signal
    const notRetained = rows.filter(row=>num(row,'retained_last_term_flag')===0);
    insights.push({n:33, title:'Retention Weak Signal', count:`${pct(notRetained.length,N)}% not retained`, badge:pct(notRetained.length,N)>10?'urgent':'good', def:'Prior term not retained.'});
    m[33] = notRetained;

    // 34. Claims Backlog
    const claimBacklog = mean(rows.map(row=>num(row,'claims_open_count')));
    const highClaimBacklog = rows.filter(row=>num(row,'claims_open_count')>0.2);
    insights.push({n:34, title:'Claims Backlog', count:claimBacklog.toFixed(2)+' open claims/HH', badge:claimBacklog>0.2?'urgent':'good', def:'Open claims per HH exceeds threshold.'});
    m[34] = highClaimBacklog;

    // 35. High Claim Frequency Cohort
    const segClaimClosed: Record<string, number[]> = {};
    rows.forEach(row=>{
      const seg = str(row,'segment_tier');
      (segClaimClosed[seg] = segClaimClosed[seg] || []).push(num(row,'claims_closed_12m'));
    });
    const cohortHigh = Object.entries(segClaimClosed).filter(([_,arr])=> mean(arr) > 1.5*mean(rows.map(r=>num(r,'claims_closed_12m'))) ).map(([seg])=>seg);
    insights.push({n:35, title:'High Claim Frequency Cohort', count:cohortHigh.join(', '), badge:cohortHigh.length?'opportunity':'good', def:'Segment w/ higher claims_closed_12m/HH.'});
    m[35] = rows.filter(row=>cohortHigh.includes(str(row,'segment_tier')));

    // 36. Experience Quality Dip
    const eqDip = mean(rows.map(row=>num(row,'claims_open_count'))) > mean(rows.map(row=>num(row,'claims_closed_12m')));
    insights.push({n:36, title:'Experience Quality Dip', count:eqDip?'Dip':'Stable', badge:eqDip?'urgent':'good', def:'EQ proxy falling (open claims up, closed claims down).'});
    m[36] = eqDip ? rows : [];

    // 37. Review Freshness Gap
    const staleDate = new Date(Date.now() - 365*24*60*60*1000);
    const reviewStale = rows.filter(row=> !str(row,'last_reviewed_date') || new Date(str(row,'last_reviewed_date')) < staleDate );
    insights.push({n:37, title:'Review Freshness Gap', count:reviewStale.length, badge:reviewStale.length>20?'urgent':'good', def:'HH not reviewed in > 12 months.'});
    m[37] = reviewStale;

    // 38. Churn Risk Hot List
    const churnArr = rows.map(row=>num(row,'churn_risk_score_0_1'));
    const churnP90 = percentile(churnArr,90);
    const churnHot = rows.filter(row=> num(row,'churn_risk_score_0_1')>=churnP90 && daysUntil(str(row,'renewal_date'))<60 );
    insights.push({n:38, title:'Churn Risk Hot List', count:churnHot.length, badge:churnHot.length>10?'urgent':'good', def:'Top decile churn risk approaching renewal.'});
    m[38] = churnHot;

    // 39. Account Value Underweighted
    const premiumArr = rows.map(row=>num(row,'written_premium_total'));
    const premiumP75 = percentile(premiumArr,75);
    const underweighted = rows.filter(row=> num(row,'written_premium_total')>=premiumP75 && num(row,'lines_count')===1 );
    insights.push({n:39, title:'Account Value Underweighted', count:underweighted.length, badge:underweighted.length>10?'opportunity':'good', def:'High premium accounts with shallow depth.'});
    m[39] = underweighted;

    // 40. Commission Efficiency
    const commArr = rows.map(row=>{
      const commission = num(row,'written_premium_total') * (num(row,'commission_rate_pct')/100);
      const minutes = num(row,'service_touches_12m') * Math.max(num(row,'avg_minutes_per_touch'), 0.0001);
      return commission / minutes;
    });
    const commEff = mean(commArr);
    insights.push({n:40, title:'Commission Efficiency', count:'$'+commEff.toFixed(2)+' per minute', badge:commEff<2?'warn':'good', def:'Commission per service minute.'});
    m[40] = rows.filter(row=>{
      const commission = num(row,'written_premium_total') * (num(row,'commission_rate_pct')/100);
      const minutes = num(row,'service_touches_12m') * Math.max(num(row,'avg_minutes_per_touch'), 0.0001);
      return (commission / minutes) < 2;
    });

    // 41. Remarketing ROI
    const roiHH = rows.filter(row=> num(row,'est_minutes_per_remarket')*1.25 > num(row,'written_premium_total')*0.01 );
    insights.push({n:41, title:'Remarketing ROI', count:roiHH.length, badge:roiHH.length>10?'opportunity':'good', def:'Net gain from remarkets vs time spent.'});
    m[41] = roiHH;

    // 42. Discount Leakage
    const discountLeak = rows.filter(row=> num(row,'bundle_discount_flag')===0 || num(row,'safe_driver_flag')===0 );
    insights.push({n:42, title:'Discount Leakage', count:discountLeak.length, badge:discountLeak.length>10?'opportunity':'good', def:'Eligible discounts not applied.'});
    m[42] = discountLeak;

    // 43. Carrier Mix Concentration
    const carrierArr: Record<string, number> = {};
    rows.forEach(row=> carrierArr[str(row,'primary_carrier')] = (carrierArr[str(row,'primary_carrier')]||0) + 1);
    const carrierMix = Object.entries(carrierArr).filter(([_,n])=> pct(n as number,N) > 45).map(([c])=>c);
    insights.push({n:43, title:'Carrier Mix Concentration', count:carrierMix.join(', '), badge:carrierMix.length?'warn':'good', def:'Over-reliance on one carrier > 45%.'});
    m[43] = rows.filter(row=> carrierMix.includes(str(row,'primary_carrier')) );

    // 44. Rate Shock Sensitivity
    const rateShock = rows.filter(row=> (num(row,'churn_risk_score_0_1')>=0.6 || num(row,'remarkets_12m')>=1) && daysUntil(str(row,'renewal_date'))<60 );
    insights.push({n:44, title:'Rate Shock Sensitivity', count:rateShock.length, badge:rateShock.length>10?'urgent':'good', def:'Accounts with high rate-change likelihood.'});
    m[44] = rateShock;

    // 45-48 placeholders needing producer/event data
    insights.push({n:45, title:'Producer Depth Delta', count:'(producer column needed)', badge:'warn', def:'Producer’s depth vs agency average.'}); m[45] = [];
    insights.push({n:46, title:'Producer TBN Opportunity', count:'(producer column needed)', badge:'warn', def:'Hours reclaimable from Top-N splits.'}); m[46] = [];
    const officeRL: Record<string,{count:number;sum:number}> = {};
    rows.forEach(row=>{
      const o = str(row,'office_location');
      (officeRL[o] = officeRL[o] || {count:0,sum:0});
      officeRL[o].count++;
      officeRL[o].sum += num(row,'remarkets_12m');
    });
    const officeRLAvg = mean(rows.map(row=>num(row,'remarkets_12m')));
    const officeRLout = Object.entries(officeRL).filter(([_,val])=> val.sum/val.count > 1.5*officeRLAvg ).map(([o])=>o);
    insights.push({n:47, title:'Office RL Outlier', count:officeRLout.join(', '), badge:officeRLout.length?'warn':'good', def:'Office RL exceeds agency by 50%+ for 2 months.'});
    m[47] = rows.filter(row=> officeRLout.includes(str(row,'office_location')));

    insights.push({n:48, title:'Win Rate After Outreach', count:'(event log needed)', badge:'warn', def:'Conversion after Top-N outreach.'});
    m[48] = [];

    // 49. Data Confidence Gap
    const confidenceGap = rows.filter(row=> num(row,'data_confidence',1)<0.7 || !str(row,'renewal_date') || !num(row,'lines_count') || !num(row,'avg_minutes_per_touch') );
    insights.push({n:49, title:'Data Confidence Gap', count:confidenceGap.length, badge:confidenceGap.length>5?'warn':'good', def:'Rows with data_confidence below threshold or key nulls.'});
    m[49] = confidenceGap;

    // 50. Template Compliance
    const missing = REQUIRED_COLS.filter(c=> !fields.includes(c));
    insights.push({n:50, title:'Template Compliance', count: missing.length ? ('Missing: '+missing.join(', ')) : 'PASS', badge: missing.length ? 'urgent':'good', def:'Missing required headers or invalid types.'});
    m[50] = [];

    setMatches(m);
    return insights;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, fields]);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse<Row>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const parsed = (res.data || []).filter(r => Object.keys(r||{}).length);
        const f = (res.meta && (res.meta as any).fields) ? (res.meta as any).fields as string[] : [];
        setRows(parsed);
        setFields(f);
        setMissingCols(REQUIRED_COLS.filter(c => !f.includes(c)));
      }
    });
  }

  function clearAll() {
    inputRef.current && (inputRef.current.value = "");
    setRows([]);
    setFields([]);
    setMissingCols([]);
    setMatches({});
    setModal({ open:false });
  }

  const summaryMsg = rows.length
    ? missingCols.length
      ? `Loaded ${N} rows. Missing required: ${missingCols.join(", ")}`
      : `Loaded ${N} households. Headers OK`
    : "";

  return (
    <div className="mx-auto max-w-6xl p-6">
      <header className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-extrabold uppercase text-indigo-300">Bundle Bench — 50 Insights</h1>
        <div className="flex gap-2 items-center">
          <input ref={inputRef} type="file" accept=".csv" onChange={onFileChange} />
          <button className="badge border-white/20" onClick={clearAll}>Clear</button>
        </div>
      </header>

      {summaryMsg && (
        <div className="mb-2 text-sm">
          <b>{summaryMsg}</b>
          {rows.length ? <span className="ml-2 badge bg-green-500 text-white">Insights computed</span> : null}
        </div>
      )}

      {rows.length ? (
        <div className="overflow-auto">
          <table className="min-w-full border border-white/10">
            <thead className="bg-white/5">
              <tr>
                <th className="p-2 text-left">#</th>
                <th className="p-2 text-left">Title</th>
                <th className="p-2 text-left">Count / Value</th>
                <th className="p-2 text-left">Badge</th>
                <th className="p-2 text-left">Definition</th>
              </tr>
            </thead>
            <tbody>
              {insights.map((ins) => {
                const badgeClass =
                  ins.badge === "urgent" ? "bg-red-500" :
                  ins.badge === "opportunity" ? "bg-indigo-500" :
                  ins.badge === "good" ? "bg-emerald-500" :
                  ins.badge === "warn" ? "bg-amber-500" : "bg-slate-500";
                return (
                  <tr key={ins.n} className="border-t border-white/10">
                    <td className="p-2 align-top">{ins.n}</td>
                    <td className="p-2 align-top">
                      <button
                        className="underline"
                        onClick={() => setModal({ open:true, insight: ins.n })}
                      >
                        {ins.title}
                      </button>
                    </td>
                    <td className="p-2 align-top">{ins.count}</td>
                    <td className="p-2 align-top">
                      <span className={`inline-block text-white text-xs font-semibold rounded-full px-2 py-0.5 ${badgeClass}`}>
                        {ins.badge}
                      </span>
                    </td>
                    <td className="p-2 align-top">{ins.def}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card">
          <h2 className="font-bold mb-2">Upload a CSV to analyze</h2>
          <p>We’ll compute 50 operational insights and let you export matched rows per insight.</p>
        </div>
      )}

      {/* Modal */}
      {modal.open && (
        <div
          className="fixed inset-0 bg-black/60 z-50"
          onClick={(e) => { if (e.currentTarget === e.target) setModal({ open:false }); }}
        >
          <div className="bg-white text-slate-900 max-w-5xl w-[92vw] max-h-[80vh] overflow-auto rounded-xl shadow-2xl p-4 mt-10 mx-auto relative">
            <button
              className="absolute top-2 right-3 text-2xl"
              onClick={() => setModal({ open:false })}
              aria-label="Close"
            >
              &times;
            </button>
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="font-semibold text-lg">Accounts for Insight #{modal.insight}</h2>
                <div className="text-sm text-slate-600">
                  {matches[modal.insight ?? 0]?.length ?? 0} row(s)
                </div>
              </div>
              <button
                className="border rounded px-3 py-1 bg-slate-50"
                onClick={() => exportRowsToCsv(matches[modal.insight ?? 0] || [], `insight_${modal.insight}.csv`)}
              >
                Export rows to CSV
              </button>
            </div>

            {/* Rows table */}
            <div className="overflow-auto">
              {(() => {
                const rowsForInsight = matches[modal.insight ?? 0] || [];
                if (!rowsForInsight.length) return <div className="text-sm">No matching accounts found.</div>;
                const headers = Array.from(
                  rowsForInsight.slice(0, 50).reduce<Set<string>>((s, r) => {
                    Object.keys(r || {}).forEach((k) => s.add(k));
                    return s;
                  }, new Set())
                );

                return (
                  <table className="min-w-full border border-slate-200 text-sm">
                    <thead className="bg-slate-100 sticky top-0">
                      <tr>{headers.map(h => <th key={h} className="p-2 border border-slate-200 text-left">{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {rowsForInsight.map((r, i) => (
                        <tr key={i} className="border-t border-slate-200">
                          {headers.map((h) => (
                            <td key={h} className="p-2 border border-slate-200">{r[h] ?? "-"}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
