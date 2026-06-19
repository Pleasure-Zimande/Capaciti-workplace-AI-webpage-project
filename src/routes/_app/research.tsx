import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { Search, Sparkles, Copy, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { researchTopic } from "@/lib/ai.functions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { AiDisclaimer } from "@/components/ai-disclaimer";
import { ToolPageHeader } from "@/components/tool-page-header";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/research")({
  head: () => ({
    meta: [
      { title: "AI Research Assistant | Taskgenie" },
      { name: "description", content: "Structured research briefs, insights, and next steps." },
    ],
  }),
  component: ResearchPage,
});

const STORAGE_KEY = "wai:last-research";

function ResearchPage() {
  const research = useServerFn(researchTopic);
  const [topic, setTopic] = useState("");
  const [context, setContext] = useState("");
  const [output, setOutput] = useState<string>(() =>
    typeof window === "undefined" ? "" : localStorage.getItem(STORAGE_KEY) ?? "",
  );
  const [copied, setCopied] = useState(false);

  const m = useMutation({
    mutationFn: () => research({ data: { topic, context } }),
    onSuccess: (res) => {
      setOutput(res.text);
      localStorage.setItem(STORAGE_KEY, res.text);
    },
    onError: (e: Error) => toast.error(e.message || "Research failed"),
  });

  const copy = async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <ToolPageHeader
        icon={Search}
        title="AI Research Assistant"
        description="Get a structured brief on any topic — summary, insights, risks, and next steps."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="text-base">Research request</CardTitle>
            <CardDescription>Be specific for better insights.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="t">Topic</Label>
              <Input
                id="t"
                placeholder="e.g. SOC 2 readiness for a 20-person SaaS startup"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c">Context (optional)</Label>
              <Textarea
                id="c"
                rows={8}
                placeholder="What's your role, the audience, decisions to support, deadlines..."
                value={context}
                onChange={(e) => setContext(e.target.value)}
              />
            </div>
            <Button
              onClick={() => m.mutate()}
              disabled={m.isPending || topic.trim().length < 3}
              className="w-full bg-gradient-primary text-primary-foreground hover:opacity-95"
            >
              {m.isPending ? <Shimmer>Researching...</Shimmer> : <><Sparkles className="mr-2 h-4 w-4" />Research</>}
            </Button>
            <AiDisclaimer />
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Brief</CardTitle>
              <CardDescription>Structured, scannable, actionable.</CardDescription>
            </div>
            {output && (
              <Button size="sm" variant="outline" onClick={copy}>
                {copied ? <Check className="mr-1 h-4 w-4" /> : <Copy className="mr-1 h-4 w-4" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {m.isPending ? (
              <div className="space-y-3">
                {[1, 0.85, 1, 0.7, 0.95, 0.6].map((w, i) => (
                  <div key={i} className="h-4 animate-pulse rounded bg-muted" style={{ width: `${w * 100}%` }} />
                ))}
              </div>
            ) : output ? (
              <article className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>{output}</ReactMarkdown>
              </article>
            ) : (
              <p className="text-sm text-muted-foreground">Your research brief will appear here.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
