import { createFileRoute, useNavigate, useParams, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import ReactMarkdown from "react-markdown";
import { MessageSquarePlus, MessageSquare, Trash2, Loader2, Send } from "lucide-react";
import {
  listThreads,
  createThread,
  deleteThread,
  renameThread,
  getThreadMessages,
} from "@/lib/chat.functions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputSubmit,
  PromptInputFooter,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { BrandLogo } from "@/components/brand-logo";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/chat/$threadId")({
  head: () => ({
    meta: [
      { title: "AI Chat | Taskgenie" },
      { name: "description", content: "Your AI conversation." },
    ],
  }),
  component: ChatThreadPage,
});

function ChatThreadPage() {
  const { threadId } = useParams({ from: "/_app/chat/$threadId" });
  return <ChatLayout threadId={threadId} key={threadId} />;
}

function ChatLayout({ threadId }: { threadId: string }) {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const list = useServerFn(listThreads);
  const create = useServerFn(createThread);
  const del = useServerFn(deleteThread);
  const rename = useServerFn(renameThread);
  const getMsgs = useServerFn(getThreadMessages);

  const threadsQ = useQuery({ queryKey: ["chat-threads"], queryFn: () => list() });
  const msgsQ = useQuery({
    queryKey: ["chat-messages", threadId],
    queryFn: () => getMsgs({ data: { threadId } }),
  });

  const createM = useMutation({
    mutationFn: () => create({ data: {} }),
    onSuccess: (t) => {
      qc.invalidateQueries({ queryKey: ["chat-threads"] });
      navigate({ to: "/chat/$threadId", params: { threadId: t.id } });
    },
  });

  const deleteM = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: (_d, id) => {
      qc.invalidateQueries({ queryKey: ["chat-threads"] });
      if (id === threadId) {
        navigate({ to: "/chat" });
      }
    },
  });

  const initial = useMemo<UIMessage[]>(
    () => (msgsQ.data ?? []) as unknown as UIMessage[],
    [msgsQ.data],
  );

  if (msgsQ.isLoading) {
    return (
      <div className="grid h-[60vh] place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="grid h-[calc(100vh-7rem)] gap-4 md:grid-cols-[260px_1fr]">
      <Card className="hidden h-full flex-col overflow-hidden md:flex shadow-soft p-0">
        <div className="flex items-center justify-between gap-2 border-b p-3">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Conversations</span>
          <Button size="icon-sm" variant="ghost" onClick={() => createM.mutate()} disabled={createM.isPending} aria-label="New chat">
            <MessageSquarePlus className="h-4 w-4" />
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <ul className="space-y-0.5 p-2">
            {(threadsQ.data ?? []).map((t) => (
              <li
                key={t.id}
                className={cn(
                  "group flex items-center gap-1 rounded-md text-sm",
                  t.id === threadId ? "bg-accent text-accent-foreground" : "hover:bg-muted",
                )}
              >
                <Link
                  to="/chat/$threadId"
                  params={{ threadId: t.id }}
                  className="flex flex-1 items-center gap-2 truncate px-2 py-1.5"
                >
                  <MessageSquare className="h-3.5 w-3.5 shrink-0 opacity-60" />
                  <span className="truncate">{t.title}</span>
                </Link>
                <button
                  type="button"
                  aria-label="Delete conversation"
                  className="invisible mr-1 rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive group-hover:visible"
                  onClick={() => {
                    if (confirm("Delete this conversation?")) deleteM.mutate(t.id);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
            {(threadsQ.data ?? []).length === 0 && (
              <li className="px-3 py-6 text-center text-xs text-muted-foreground">
                No conversations yet.
              </li>
            )}
          </ul>
        </ScrollArea>
      </Card>

      <ChatWindow
        threadId={threadId}
        initialMessages={initial}
        onFirstUserMessage={async (text) => {
          // Auto-title the thread on first message
          const trimmed = text.trim().slice(0, 60);
          if (!trimmed) return;
          await rename({ data: { id: threadId, title: trimmed } });
          qc.invalidateQueries({ queryKey: ["chat-threads"] });
        }}
        threadHasMessages={initial.length > 0}
      />
    </div>
  );
}

function ChatWindow({
  threadId,
  initialMessages,
  onFirstUserMessage,
  threadHasMessages,
}: {
  threadId: string;
  initialMessages: UIMessage[];
  onFirstUserMessage: (text: string) => void | Promise<void>;
  threadHasMessages: boolean;
}) {
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const [input, setInput] = useState("");

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: { threadId },
        fetch: async (url, init) => {
          const { data } = await supabase.auth.getSession();
          const token = data.session?.access_token;
          const headers = new Headers(init?.headers);
          if (token) headers.set("Authorization", `Bearer ${token}`);
          return fetch(url, { ...init, headers });
        },
      }),
    [threadId],
  );

  const { messages, sendMessage, status, error } = useChat({
    id: threadId,
    messages: initialMessages,
    transport,
    onError: (e) => toast.error(e.message || "Chat error"),
  });

  const isBusy = status === "submitted" || status === "streaming";

  useEffect(() => {
    inputRef.current?.focus();
  }, [threadId, status]);

  const onSubmit = async (msg: { text?: string }) => {
    const text = (msg.text ?? input).trim();
    if (!text || isBusy) return;
    setInput("");
    const isFirst = !threadHasMessages && messages.length === 0;
    if (isFirst) void onFirstUserMessage(text);
    await sendMessage({ text });
  };

  return (
    <Card className="flex h-full flex-col overflow-hidden shadow-soft p-0">
      <Conversation className="flex-1">
        <ConversationContent>
          {messages.length === 0 ? (
            <EmptyState onPick={(t) => setInput(t)} />
          ) : (
            messages.map((m) => {
              const text = m.parts
                .map((p) => (p.type === "text" ? p.text : ""))
                .join("");
              return (
                <Message from={m.role} key={m.id}>
                  <MessageContent>
                    {m.role === "assistant" ? (
                      <MessageResponse>{text}</MessageResponse>
                    ) : (
                      <div className="whitespace-pre-wrap">{text}</div>
                    )}
                  </MessageContent>
                </Message>
              );
            })
          )}
          {status === "submitted" && (
            <Message from="assistant">
              <MessageContent>
                <Shimmer>Thinking...</Shimmer>
              </MessageContent>
            </Message>
          )}
          {error && (
            <p className="px-2 text-xs text-destructive">{error.message}</p>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
      <div className="border-t bg-card p-3">
        <PromptInput onSubmit={onSubmit}>
          <PromptInputTextarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything..."
            disabled={isBusy}
          />
          <PromptInputFooter className="justify-end">
            <PromptInputSubmit status={status} disabled={!input.trim() || isBusy} />
          </PromptInputFooter>
        </PromptInput>
        <p className="mt-2 text-center text-[11px] text-muted-foreground">
          AI-generated content may require human review.
        </p>
      </div>
    </Card>
  );
}

const SUGGESTIONS = [
  "Draft a polite follow-up email to a customer who hasn't replied in 2 weeks.",
  "Summarize this meeting and pull out action items: [paste notes]",
  "Help me prioritize this list of 10 tasks for the week.",
  "Give me a research brief on enterprise SSO best practices.",
];

function EmptyState({ onPick }: { onPick: (s: string) => void }) {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-6 py-10 text-center">
      <BrandLogo size={56} />
      <div>
        <h2 className="text-xl font-semibold">How can I help today?</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Try one of these prompts or ask anything.
        </p>
      </div>
      <div className="grid w-full gap-2 sm:grid-cols-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => onPick(s)}
            className="rounded-lg border bg-background p-3 text-left text-xs text-foreground/80 transition-all hover:border-primary/50 hover:bg-accent hover:shadow-soft"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
