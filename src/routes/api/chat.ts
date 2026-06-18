import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import type { Database } from "@/integrations/supabase/types";

const SYSTEM_PROMPT = `You are the AI Workplace Productivity Assistant: a friendly, capable assistant for professionals.

You help with:
- Drafting emails, messages, and other business writing
- Summarizing meeting notes and documents
- Planning, prioritizing, and scheduling tasks
- Researching topics and surfacing insights
- Brainstorming, decision support, and general work questions

Style:
- Professional, warm, and concise.
- Use markdown when it improves clarity (lists, tables, headings).
- Ask a clarifying question only if the request is truly ambiguous; otherwise make sensible assumptions and proceed.
- Be honest about uncertainty. Never fabricate facts, statistics, or quotes.

Always remind yourself that AI-generated content may require human review.`;

type ChatBody = { messages?: unknown; threadId?: unknown };

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as ChatBody;
        const messages = body.messages;
        const threadId = typeof body.threadId === "string" ? body.threadId : null;
        if (!Array.isArray(messages)) {
          return new Response("messages required", { status: 400 });
        }

        const authHeader = request.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
          return new Response("Unauthorized", { status: 401 });
        }
        const token = authHeader.slice(7);

        const SUPABASE_URL = process.env.SUPABASE_URL!;
        const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY!;
        const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
          global: { headers: { Authorization: `Bearer ${token}` } },
          auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
        });
        const { data: claims, error: claimsError } = await supabase.auth.getClaims(token);
        const userId = claims?.claims?.sub;
        if (claimsError || !userId) {
          return new Response("Unauthorized", { status: 401 });
        }

        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });
        const gateway = createLovableAiGatewayProvider(key);

        const uiMessages = messages as UIMessage[];

        // Persist the latest user message immediately (the assistant message persists in onFinish)
        if (threadId && uiMessages.length > 0) {
          const last = uiMessages[uiMessages.length - 1];
          if (last.role === "user") {
            const { data: existing } = await supabase
              .from("chat_messages")
              .select("id")
              .eq("thread_id", threadId)
              .eq("user_id", userId)
              .filter("message->>id", "eq", last.id)
              .maybeSingle();
            if (!existing) {
              await supabase.from("chat_messages").insert({
                thread_id: threadId,
                user_id: userId,
                role: "user",
                message: last as unknown as Database["public"]["Tables"]["chat_messages"]["Row"]["message"],
              });
            }
          }
        }

        const result = streamText({
          model: gateway("google/gemini-3-flash-preview"),
          system: SYSTEM_PROMPT,
          messages: await convertToModelMessages(uiMessages),
        });

        return result.toUIMessageStreamResponse({
          originalMessages: uiMessages,
          onFinish: async ({ messages: finalMessages }) => {
            if (!threadId) return;
            const assistant = [...finalMessages].reverse().find((m) => m.role === "assistant");
            if (!assistant) return;
            await supabase.from("chat_messages").insert({
              thread_id: threadId,
              user_id: userId,
              role: "assistant",
              message: assistant as unknown as Database["public"]["Tables"]["chat_messages"]["Row"]["message"],
            });
            await supabase
              .from("chat_threads")
              .update({ updated_at: new Date().toISOString() })
              .eq("id", threadId);
          },
        });
      },
    },
  },
});
