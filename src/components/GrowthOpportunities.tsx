import InsightCard from "./InsightCard";

type Opportunity = {
  title: string;
  description: string;
  impact: number;
  urgency: number;
  confidence: string;
  onAdd?: () => void;
};

type Props = {
  opportunities: Opportunity[];
};

export default function GrowthOpportunities({ opportunities }: Props) {
  // Sort by impact descending and take top 10
  const topOpportunities = [...opportunities]
    .sort((a, b) => b.impact - a.impact)
    .slice(0, 10);

  return (
    <div>
      <h2 className="mb-4 text-xl font-bold">Top 10 Growth Opportunities</h2>
      <div
        className="flex gap-4 overflow-x-auto pb-4"
        style={{ scrollSnapType: "x mandatory" }}
      >
        {topOpportunities.map((item, idx) => (
          <div
            key={idx}
            className="min-w-[320px] max-w-[320px] flex-1 scroll-snap-align-start"
            style={{ flexBasis: "33.3333%" }}
          >
            <InsightCard {...item} />
          </div>
        ))}
      </div>
    </div>
  );
}
