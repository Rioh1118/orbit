import { sliceColor } from "@/lib/chartTheme";
import { modeLabel, type ModeDelta } from "@/lib/thenVsNow";

function pct(share: number): string {
  return `${Math.round(share * 100)}%`;
}

interface DeltaTableProps {
  deltas: ModeDelta[];
}

/**
 * Then→Now share deltas per mode (brief §7.9). The ▲/▼ glyph is non-text (icon): it
 * is `accent` only on an improvement-direction significant change, otherwise neutral
 * ink-muted — regressions are never greened. Direction is carried in text (the signed
 * pp value) and an sr-only label, so it is never conveyed by colour alone (1.4.1).
 */
export function DeltaTable({ deltas }: DeltaTableProps) {
  return (
    <table className="w-full text-sm">
      <caption className="sr-only">モード別の Then から Now への配分変化</caption>
      <thead>
        <tr className="border-b border-border text-xs text-ink-muted">
          <th scope="col" className="py-2 text-left font-medium">
            モード
          </th>
          <th scope="col" className="py-2 text-right font-medium">
            Then
          </th>
          <th scope="col" className="py-2 text-right font-medium">
            Now
          </th>
          <th scope="col" className="py-2 text-right font-medium">
            変化
          </th>
        </tr>
      </thead>
      <tbody>
        {deltas.map((d) => {
          const sign = d.deltaPp > 0 ? "+" : "-";
          const srDirection =
            d.deltaPp > 0 ? "増加" : d.deltaPp < 0 ? "減少" : "変化なし";
          return (
            <tr key={d.mode} className="border-b border-border/60">
              <td className="py-2 text-ink">
                <span className="inline-flex items-center gap-2">
                  <span
                    aria-hidden
                    className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm"
                    style={{ backgroundColor: sliceColor(d.mode) }}
                  />
                  {modeLabel(d.mode)}
                </span>
              </td>
              <td className="py-2 text-right font-mono text-ink-muted">{pct(d.thenShare)}</td>
              <td className="py-2 text-right font-mono text-ink">{pct(d.nowShare)}</td>
              <td className="py-2 text-right font-mono text-ink-muted">
                {d.deltaPp === 0 ? (
                  "±0pp"
                ) : (
                  <>
                    <span
                      aria-hidden
                      className={`mr-1 ${d.improvement ? "text-accent" : "text-ink-muted"}`}
                    >
                      {d.deltaPp > 0 ? "▲" : "▼"}
                    </span>
                    {sign}
                    {Math.abs(d.deltaPp)}pp
                  </>
                )}
                <span className="sr-only">
                  {" "}
                  {srDirection}
                  {d.improvement ? " 改善" : ""}
                </span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
