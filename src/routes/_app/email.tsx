import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { Mail, Sparkles } from "lucide-react";
import { generateEmail } from "@/lib/ai.functions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { AiDisclaimer } from "@/components/ai-disclaimer";
import { ToolPageHeader } from "@/components/tool-page-header";
import { AIResultCard } from "@/components/ai-result-card";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/email")({
  head: () => ({
    meta: [
      { title: "Smart Email Generator | Workplace AI" },
      { name: "description", content: "Generate professional emails tuned to tone and audience." },
    ],
  }),
  component: EmailPage,
});

type Tone = "professional" | "friendly" | "persuasive" | "concise" | "apologetic" | "enthusiastic";
type Length = "short" | "medium" | "long";
const STORAGE_KEY = "wai:last-email";

function EmailPage() {
  const generate = useServerFn(generateEmail);
  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("");
  const [tone, setTone] = useState<Tone>("professional");
  const [length, setLength] = useState<Length>("medium");
  const [output, setOutput] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem(STORAGE_KEY) ?? "";
  });

  const m = useMutation({
    mutationFn: () => generate({ data: { topic, audience, tone, length } }),
    onSuccess: (res) => {
      setOutput(res.text);
      localStorage.setItem(STORAGE_KEY, res.text);
    },
    onError: (e: Error) => toast.error(e.message || "Generation failed"),
  });

  const canGenerate = topic.trim().length >= 3 && audience.trim().length >= 2;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <ToolPageHeader
        icon={Mail}
        title="Smart Email Generator"
        description="Describe your purpose and we'll craft a polished email tuned to your tone and audience."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="text-base">Compose</CardTitle>
            <CardDescription>Fill in the details and generate.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="audience">Audience</Label>
              <Input
                id="audience"
                placeholder="e.g. our enterprise customer's procurement team"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Tone</Label>
                <Select value={tone} onValueChange={(v) => setTone(v as Tone)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="friendly">Friendly</SelectItem>
                    <SelectItem value="persuasive">Persuasive</SelectItem>
                    <SelectItem value="concise">Concise</SelectItem>
                    <SelectItem value="apologetic">Apologetic</SelectItem>
                    <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Length</Label>
                <Select value={length} onValueChange={(v) => setLength(v as Length)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short">Short</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="long">Long</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="topic">Purpose / context</Label>
              <Textarea
                id="topic"
                rows={7}
                placeholder="e.g. Follow up on yesterday's pricing call. Confirm we'll send a revised proposal Friday and request intro to their security lead."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>
            <Button
              onClick={() => m.mutate()}
              disabled={m.isPending || !canGenerate}
              className="w-full bg-gradient-primary text-primary-foreground hover:opacity-95"
            >
              {m.isPending ? (
                <Shimmer>Generating...</Shimmer>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate email
                </>
              )}
            </Button>
            <AiDisclaimer />
          </CardContent>
        </Card>

        <AIResultCard
          title="Result"
          description="Edit, regenerate, or copy."
          value={output}
          onChange={(v) => {
            setOutput(v);
            localStorage.setItem(STORAGE_KEY, v);
          }}
          isLoading={m.isPending}
          onRegenerate={() => m.mutateAsync()}
          canRegenerate={canGenerate}
          emptyText="Your generated email will appear here."
          monospace
        />
      </div>
    </div>
  );
}
