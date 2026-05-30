interface InsightItemProps {
  before: string;
  after: string;
  date?: string;
}

export function InsightItem({ before, after, date }: InsightItemProps) {
  return (
    <article className="border-l-2 border-parchment/40 pl-4">
      <p className="font-serif text-sm italic text-mist">
        <span className="font-mono text-xs uppercase not-italic tracking-instrument text-mist/70">
          before ·{" "}
        </span>
        {before}
      </p>
      <p className="mt-1.5 font-serif text-base leading-relaxed text-parchment">
        <span className="font-mono text-xs uppercase not-italic tracking-instrument text-parchment/70">
          after ·{" "}
        </span>
        {after}
      </p>
      {date && (
        <p className="mt-2 font-mono text-xs uppercase tracking-instrument text-parchment-muted">
          {date}
        </p>
      )}
    </article>
  );
}
