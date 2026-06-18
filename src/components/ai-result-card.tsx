import { useEffect, useRef, useState } from "react";
import { Copy, Check, RefreshCw, Pencil } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AiDisclaimer } from "@/components/ai-disclaimer";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AIResultCardProps {
  title?: string;
  description?: string;
  value: string;
  onChange: (next: string) => void;
  onRegenerate?: () => void;
  isLoading?: boolean;
  canRegenerate?: boolean;
  emptyHint?: string;
  minRows?: number;
  mono?: boolean;
}

export function AIResultCard({
  title = "Result",
  description = "Review, edit, and copy.",
  value,
  onChange,
  onRegenerate,
  isLoading = false,
  canRegenerate = true,
  emptyHint = "Your AI-generated result will appear here.",
  minRows = 14,
  mono = false,
}: AIResultCardProps) {
  const [copied, setCopied] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);

  // auto-grow
  useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(el.scrollHeight, minRows * 22)}px`;
  }, [value, minRows, isLoading]);

  const copy = async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy to clipboard");
    }
  };

  const hasContent = value.trim().length > 0;

  return (
    <Card className="shadow-soft">
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <TooltipProvider delayDuration={200}>
          <div className="flex items-center gap-1 rounded-md border bg-background/60 p-0.5">
            {onRegenerate && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                    onClick={onRegenerate}
                    disabled={isLoading || !canRegenerate}
                    aria-label="Regenerate response"
                  >
                    <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Regenerate response</TooltipContent>
              </Tooltip>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-muted-foreground hover:text-primary"
                  onClick={copy}
                  disabled={!hasContent || isLoading}
                  aria-label="Copy to clipboard"
                >
                  {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{copied ? "Copied" : "Copy to clipboard"}</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading && !hasContent ? (
          <SkeletonBlock rows={Math.min(minRows, 8)} />
        ) : (
          <div className="group relative">
            <textarea
              ref={taRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={emptyHint}
              spellCheck
              disabled={isLoading}
              className={cn(
                "w-full resize-none rounded-md border border-transparent bg-muted/30 px-3 py-2.5 text-sm leading-relaxed outline-none transition-colors",
                "hover:border-border focus:border-ring focus:bg-background focus:ring-2 focus:ring-ring/20",
                "placeholder:text-muted-foreground",
                mono && "font-mono text-[13px]",
                isLoading && "opacity-60",
              )}
              style={{ minHeight: `${minRows * 22}px` }}
            />
            {hasContent && (
              <Pencil
                className="pointer-events-none absolute right-2 top-2 h-3.5 w-3.5 text-muted-foreground/50 opacity-0 transition-opacity group-hover:opacity-100"
                aria-hidden
              />
            )}
            {isLoading && hasContent && (
              <div className="absolute inset-0 flex items-center justify-center rounded-md bg-background/40 backdrop-blur-[1px]">
                <div className="flex items-center gap-2 rounded-full border bg-background px-3 py-1.5 text-xs text-muted-foreground shadow-sm">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  Regenerating...
                </div>
              </div>
            )}
          </div>
        )}
        <AiDisclaimer />
      </CardContent>
    </Card>
  );
}

function SkeletonBlock({ rows = 6 }: { rows?: number }) {
  const widths = [1, 0.85, 0.95, 0.7, 1, 0.6, 0.9, 0.75];
  return (
    <div className="space-y-3 py-1">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-4 animate-pulse rounded bg-muted"
          style={{ width: `${(widths[i % widths.length] ?? 0.9) * 100}%` }}
        />
      ))}
    </div>
  );
}
