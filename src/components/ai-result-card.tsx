import { useEffect, useRef, useState } from "react";
import { Copy, Check, RefreshCw, Pencil } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AiDisclaimer } from "@/components/ai-disclaimer";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Props = {
  title?: string;
  description?: string;
  value: string;
  onChange: (next: string) => void;
  isLoading?: boolean;
  onRegenerate?: () => void | Promise<void>;
  canRegenerate?: boolean;
  emptyText?: string;
  renderMarkdown?: boolean;
  monospace?: boolean;
};

export function AIResultCard({
  title = "Result",
  description = "Review, edit, and copy.",
  value,
  onChange,
  isLoading = false,
  onRegenerate,
  canRegenerate = true,
  emptyText = "Your generated content will appear here.",
  renderMarkdown = false,
  monospace = false,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const taRef = useRef<HTMLTextAreaElement | null>(null);
  const previousRef = useRef<string>("");

  // Auto-resize
  const resize = () => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };
  useEffect(() => {
    if (editing) resize();
  }, [editing, value]);

  const copy = async () => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const regenerate = async () => {
    if (!onRegenerate) return;
    previousRef.current = value;
    try {
      await onRegenerate();
    } catch {
      onChange(previousRef.current);
      toast.error("Regeneration failed. Restored previous result.");
    }
  };

  const hasContent = value.trim().length > 0;

  return (
    <Card className="shadow-soft">
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
        <div>
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        {(hasContent || isLoading) && (
          <TooltipProvider delayDuration={200}>
            <div className="flex items-center gap-1 rounded-md border bg-background/50 p-0.5">
              {!editing && hasContent && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-muted-foreground hover:text-primary"
                      onClick={() => {
                        setEditing(true);
                        setTimeout(() => taRef.current?.focus(), 0);
                      }}
                      disabled={isLoading}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Edit</TooltipContent>
                </Tooltip>
              )}
              {onRegenerate && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-muted-foreground hover:text-primary"
                      onClick={regenerate}
                      disabled={isLoading || !canRegenerate}
                    >
                      <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Regenerate response</TooltipContent>
                </Tooltip>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-muted-foreground hover:text-primary"
                    onClick={copy}
                    disabled={isLoading || !hasContent}
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{copied ? "Copied!" : "Copy to clipboard"}</TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 0.9, 0.95, 0.7, 0.85, 0.6].map((w, i) => (
              <div key={i} className="h-4 animate-pulse rounded bg-muted" style={{ width: `${w * 100}%` }} />
            ))}
          </div>
        ) : !hasContent ? (
          <p className="text-sm text-muted-foreground">{emptyText}</p>
        ) : editing || !renderMarkdown ? (
          <div className="group relative">
            <textarea
              ref={taRef}
              value={value}
              onChange={(e) => {
                onChange(e.target.value);
                resize();
              }}
              onFocus={() => setEditing(true)}
              onInput={resize}
              spellCheck
              className={cn(
                "w-full resize-none rounded-md border border-transparent bg-transparent p-3 text-sm leading-relaxed outline-none transition-colors",
                "hover:border-input focus:border-ring focus:ring-2 focus:ring-ring/30",
                "whitespace-pre-wrap",
                monospace && "font-mono text-[13px]",
              )}
              style={{ minHeight: "120px" }}
            />
            {!editing && (
              <Pencil className="pointer-events-none absolute right-2 top-2 h-3.5 w-3.5 text-muted-foreground/40 opacity-0 transition-opacity group-hover:opacity-100" />
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              setEditing(true);
              setTimeout(() => taRef.current?.focus(), 0);
            }}
            className="group relative block w-full cursor-text rounded-md border border-transparent p-3 text-left transition-colors hover:border-input"
          >
            <article className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown>{value}</ReactMarkdown>
            </article>
            <Pencil className="pointer-events-none absolute right-2 top-2 h-3.5 w-3.5 text-muted-foreground/40 opacity-0 transition-opacity group-hover:opacity-100" />
          </button>
        )}
        <AiDisclaimer />
      </CardContent>
    </Card>
  );
}
