import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { FileText, Sparkles } from "lucide-react";
import { summarizeNotes } from "@/lib/ai.functions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { AiDisclaimer } from "@/components/ai-disclaimer";
import { ToolPageHeader } from "@/components/tool-page-header";
import { AIResultCard } from "@/components/ai-result-card";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/notes")({
  head: () => ({
    meta: [
      { title: "Meeting Notes Summarizer | Workplace AI" },
      { name: "description", content: "Turn raw meeting notes into key points, decisions, and action items." },
    ],
  }),
  component: NotesPage,
});

const STORAGE_KEY = "wai:last-notes";

function NotesPage() {
  const summarize = useServerFn(summarizeNotes);
  const [transcript, setTranscript] = useState("");
  const [output, setOutput] = useState<string>(() =>
    typeof window === "undefined" ? "" : localStorage.getItem(STORAGE_KEY) ?? "",
  );

  const m = useMutation({
    mutationFn: () => summarize({ data: { transcript } }),
    onSuccess: (res) => {
      setOutput(res.text);
      localStorage.setItem(STORAGE_KEY, res.text);
    },
    onError: (e: Error) => toast.error(e.message || "Summary failed"),
  });

  const canGenerate = transcript.trim().length >= 20;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <ToolPageHeader
        icon={FileText}
        title="Meeting Notes Summarizer"
        description="Paste raw notes or a transcript. Get a clean summary with decisions, action items, and owners."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="text-base">Input</CardTitle>
            <CardDescription>Paste your meeting notes or transcript.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="t">Transcript / notes</Label>
              <Textarea
                id="t"
                rows={16}
                placeholder="Paste meeting notes here..."
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">{transcript.length.toLocaleString()} characters</p>
            </div>
            <Button
              onClick={() => m.mutate()}
              disabled={m.isPending || !canGenerate}
              className="w-full bg-gradient-primary text-primary-foreground hover:opacity-95"
            >
              {m.isPending ? <Shimmer>Summarizing...</Shimmer> : <><Sparkles className="mr-2 h-4 w-4" />Summarize</>}
            </Button>
            <AiDisclaimer />
          </CardContent>
        </Card>

        <AIResultCard
          title="Summary"
          description="Key points, decisions, and actions."
          value={output}
          onChange={(v) => {
            setOutput(v);
            localStorage.setItem(STORAGE_KEY, v);
          }}
          isLoading={m.isPending}
          onRegenerate={() => m.mutateAsync()}
          canRegenerate={canGenerate}
          emptyText="Your structured summary will appear here."
          renderMarkdown
        />
      </div>
    </div>
  );
}
