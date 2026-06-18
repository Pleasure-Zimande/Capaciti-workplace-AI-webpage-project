import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

const MODEL = "google/gemini-3-flash-preview";

function getModel() {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("Missing LOVABLE_API_KEY");
  return createLovableAiGatewayProvider(key)(MODEL);
}

/* ---------------- Email Generator ---------------- */
const EmailInput = z.object({
  topic: z.string().min(3).max(2000),
  audience: z.string().min(2).max(200),
  tone: z.enum(["professional", "friendly", "persuasive", "concise", "apologetic", "enthusiastic"]),
  length: z.enum(["short", "medium", "long"]).default("medium"),
});

export const generateEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => EmailInput.parse(d))
  .handler(async ({ data }) => {
    const system = `You are a senior business communications writer. Write polished, well-structured emails.

Rules:
- Output ONLY the email itself. No preamble, no commentary, no markdown code fences.
- Begin with "Subject: <subject line>" on its own line, then a blank line, then the email body.
- Include a clear opening, body, and sign-off.
- Match the requested tone precisely.
- Keep paragraphs short and scannable.`;
    const lengthHint = { short: "3-5 short sentences", medium: "2-3 short paragraphs", long: "4-5 paragraphs" }[data.length];
    const prompt = `Write an email with the following parameters.

Audience: ${data.audience}
Tone: ${data.tone}
Length target: ${lengthHint}

Purpose / context:
"""
${data.topic}
"""`;
    const { text } = await generateText({ model: getModel(), system, prompt });
    return { text };
  });

/* ---------------- Meeting Notes Summarizer ---------------- */
const NotesInput = z.object({
  transcript: z.string().min(20).max(20000),
});

export const summarizeNotes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => NotesInput.parse(d))
  .handler(async ({ data }) => {
    const system = `You are an expert meeting notes summarizer. Convert raw meeting notes or transcripts into a clear, structured executive summary.

Output format (markdown). Use these exact section headings:

## Summary
A 2-4 sentence overview of what was discussed and decided.

## Key Points
- Bullet list of the most important discussion points.

## Decisions
- Bullet list of decisions made. If none, write "No formal decisions recorded."

## Action Items
A markdown table with columns: Owner | Action | Deadline. Infer owners/deadlines when clearly implied; otherwise put "Unassigned" or "Not specified".

## Open Questions
- Anything left unresolved. If none, write "None".

Be concise and professional. Do not invent facts that are not supported by the input.`;
    const { text } = await generateText({
      model: getModel(),
      system,
      prompt: `Meeting notes / transcript:\n"""\n${data.transcript}\n"""`,
    });
    return { text };
  });

/* ---------------- Task Planner ---------------- */
const PlannerInput = z.object({
  tasks: z.string().min(5).max(8000),
  horizon: z.enum(["today", "this_week", "this_month"]).default("this_week"),
});

export const planTasks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => PlannerInput.parse(d))
  .handler(async ({ data }) => {
    const horizon = { today: "today", this_week: "this week", this_month: "this month" }[data.horizon];
    const system = `You are an executive productivity coach. You take a messy list of tasks and produce a prioritized, scheduled plan.

Use the Eisenhower matrix (Urgent/Important) to prioritize, then assign each task a priority (P1 highest -> P4 lowest), an estimated time, and a suggested time slot.

Output format (markdown):

## Prioritized Plan (${horizon})

### P1 — Do First (Urgent & Important)
- **Task** — est. time — suggested slot — short rationale

### P2 — Schedule (Important, Not Urgent)
- ...

### P3 — Delegate / Batch (Urgent, Not Important)
- ...

### P4 — Reconsider (Neither)
- ...

## Suggested Schedule
A simple table: Time | Task

## Tips
2-3 short, specific productivity tips tied to this plan.

Be realistic and concise. Do not invent tasks not present in input.`;
    const { text } = await generateText({
      model: getModel(),
      system,
      prompt: `Tasks to plan for ${horizon}:\n"""\n${data.tasks}\n"""`,
    });
    return { text };
  });

/* ---------------- Research Assistant ---------------- */
const ResearchInput = z.object({
  topic: z.string().min(3).max(1000),
  context: z.string().max(4000).optional().default(""),
});

export const researchTopic = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ResearchInput.parse(d))
  .handler(async ({ data }) => {
    const system = `You are a senior research analyst. Produce a structured research brief on the requested topic.

Output format (markdown):

## Executive Summary
A 3-4 sentence high-level summary.

## Background
A short paragraph providing context.

## Key Insights
- 4-7 bullets, each a specific, non-obvious insight.

## Considerations & Risks
- Bullets covering trade-offs, risks, or open questions.

## Recommended Next Steps
- 3-5 concrete actions a professional could take next.

## Suggested Sources to Verify
- 3-5 categories of sources or specific reputable outlets to consult. Do NOT invent URLs.

Be precise. Flag uncertainty explicitly. Do not fabricate statistics — say "verify with primary source" if unsure.`;
    const prompt = `Topic: ${data.topic}\n\nAdditional context:\n${data.context || "(none)"}`;
    const { text } = await generateText({ model: getModel(), system, prompt });
    return { text };
  });
