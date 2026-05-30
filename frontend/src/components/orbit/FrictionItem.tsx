import { Badge } from "@/components/ui/Badge";

interface FrictionItemProps {
  note: string;
  patternTag: string;
  resolved?: boolean;
}

export function FrictionItem({ note, patternTag, resolved = false }: FrictionItemProps) {
  return (
    <div className="flex items-start gap-3 border-b border-instrument/20 py-2.5 last:border-b-0">
      <span
        className={`mt-1.5 h-1.5 w-1.5 rounded-full ${resolved ? "bg-growth" : "bg-friction"}`}
        aria-label={resolved ? "resolved" : "open"}
      />
      <div className="min-w-0 flex-1">
        <p className={`text-sm ${resolved ? "text-parchment-muted line-through" : "text-parchment"}`}>
          {note}
        </p>
        <div className="mt-1.5">
          <Badge tone={resolved ? "growth" : "friction"}>{patternTag}</Badge>
        </div>
      </div>
    </div>
  );
}
