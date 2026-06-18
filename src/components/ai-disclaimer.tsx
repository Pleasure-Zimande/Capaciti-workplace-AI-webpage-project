import { Info } from "lucide-react";

export function AiDisclaimer({ className = "" }: { className?: string }) {
  return (
    <p
      className={`flex items-start gap-2 text-xs text-muted-foreground ${className}`}
    >
      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      AI-generated content may require human review.
    </p>
  );
}
