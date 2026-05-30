import { useState } from "react";
import { CategoryTabs, type Category } from "@/components/orbit/CategoryTabs";
import { ThenVsNowChart, type WeekPoint } from "@/components/orbit/ThenVsNowChart";
import { Divider } from "@/components/ui/Divider";
import { StatTile } from "@/components/orbit/StatTile";
import { InsightItem } from "@/components/orbit/InsightItem";

const WEEKS: WeekPoint[] = [
  { week: "W-3", code_explore: 320, implement: 90, debug: 60, spec_read: 40 },
  { week: "W-2", code_explore: 260, implement: 120, debug: 50, spec_read: 30 },
  { week: "W-1", code_explore: 190, implement: 150, debug: 40, spec_read: 25 },
  { week: "now", code_explore: 140, implement: 170, debug: 30, spec_read: 20 },
];

const MODES = ["spec_read", "debug", "implement", "code_explore"];

const INSIGHTS = [
  {
    before: "ActiveRecord の where(...).first は遅いと思っていた",
    after: "find_by が同じだと知った。N+1だけ気にすれば良い",
    date: "W-1",
  },
  {
    before: "Hotwire の turbo-frame は何にでも使えると思っていた",
    after: "frame は1ページ内で1要素しか上書きしない",
    date: "W-2",
  },
];

export default function ThenVsNowPage() {
  const [category, setCategory] = useState<Category>("learning");

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <header>
        <p className="font-mono text-xs uppercase tracking-instrument text-mist">
          then · vs · now
        </p>
        <h1 className="mt-2 font-serif text-2xl text-parchment">
          同じ作業、前より速く解けるようになった?
        </h1>
      </header>

      <CategoryTabs value={category} onChange={setCategory} />

      <section>
        <Divider label="mode allocation / last 4 weeks" />
        <div className="mt-5">
          <ThenVsNowChart data={WEEKS} modes={MODES} />
        </div>
      </section>

      <section className="grid grid-cols-3 gap-3">
        <StatTile label="explore" value="−56%" hint="W-3 → now" />
        <StatTile label="implement" value="+89%" hint="W-3 → now" />
        <StatTile label="friction · cant_find" value="−40%" hint="resolve time" />
      </section>

      <section>
        <Divider label="insights / this week" />
        <div className="mt-5 space-y-6">
          {INSIGHTS.map((i, idx) => (
            <InsightItem key={idx} {...i} />
          ))}
        </div>
      </section>
    </div>
  );
}
