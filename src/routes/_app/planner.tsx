import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { ListChecks, Sparkles, Copy, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { planTasks } from "@/lib/ai.functions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { AiDisclaimer } from "@/components/ai-disclaimer";
import { ToolPageHeader } from "@/components/tool-page-header";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/planner")({
  head: () => ({
    meta: [
      { title: "AI Task Planner | Taskgenie" },
      { name: "description", content: "Prioritize and schedule your work with AI." },
    ],
  }),
  component: PlannerPage,
});

type Horizon = "today" | "this_week" | "this_month";
const STORAGE_KEY = "wai:last-plan";

function PlannerPage() {
  const plan = useServerFn(planTasks);
  const [tasks, setTasks] = useState("");
  const [horizon, setHorizon] = useState<Horizon>("this_week");
  const [output, setOutput] = useState<string>(() =>
    typeof window === "undefined" ? "" : localStorage.getItem(STORAGE_KEY) ?? "",
  );
  const [copied, setCopied] = useState(false);

  const m = useMutation({
    mutationFn: () => plan({ data: { tasks, horizon } }),
    onSuccess: (res) => {
      setOutput(res.text);
      localStorage.setItem(STORAGE_KEY, res.text);
    },
    onError: (e: Error) => toast.error(e.message || "Planning failed"),
  });

  const copy = async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <ToolPageHeader
        icon={ListChecks}
        title="AI Task Planner"
        description="Dump your task list. Get a prioritized, scheduled plan using the Eisenhower matrix."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="text-base">Your tasks</CardTitle>
            <CardDescription>One task per line works best. Include deadlines if you have them.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Plan horizon</Label>
              <Select value={horizon} onValueChange={(v) => setHorizon(v as Horizon)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="this_week">This week</SelectItem>
                  <SelectItem value="this_month">This month</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tasks">Tasks</Label>
              <Textarea
                id="tasks"
                rows={12}
                placeholder={`- Prep Q3 board deck (due Thu)\n- Reply to 5 customer emails\n- Review PR #482\n- Run 1:1 with Sam\n- Book flights for the offsite`}
                value={tasks}
                onChange={(e) => setTasks(e.target.value)}
              />
            </div>
            <Button
              onClick={() => m.mutate()}
              disabled={m.isPending || tasks.trim().length < 5}
              className="w-full bg-gradient-primary text-primary-foreground hover:opacity-95"
            >
              {m.isPending ? <Shimmer>Planning...</Shimmer> : <><Sparkles className="mr-2 h-4 w-4" />Build my plan</>}
            </Button>
            <AiDisclaimer />
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Plan</CardTitle>
              <CardDescription>Prioritized and scheduled.</CardDescription>
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
                {[1, 0.7, 0.9, 0.5, 0.85].map((w, i) => (
                  <div key={i} className="h-4 animate-pulse rounded bg-muted" style={{ width: `${w * 100}%` }} />
                ))}
              </div>
            ) : output ? (
              <article className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>{output}</ReactMarkdown>
              </article>
            ) : (
              <p className="text-sm text-muted-foreground">Your plan will appear here.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
