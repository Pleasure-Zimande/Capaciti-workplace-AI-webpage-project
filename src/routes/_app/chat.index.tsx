import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MessageSquarePlus, MessageSquare, Loader2 } from "lucide-react";
import { listThreads, createThread } from "@/lib/chat.functions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BrandLogo } from "@/components/brand-logo";

export const Route = createFileRoute("/_app/chat/")({
  head: () => ({
    meta: [
      { title: "AI Chat | Workplace AI" },
      { name: "description", content: "Conversational AI assistant for your work." },
    ],
  }),
  component: ChatIndex,
});

function ChatIndex() {
  const navigate = useNavigate();
  const list = useServerFn(listThreads);
  const create = useServerFn(createThread);
  const qc = useQueryClient();

  const threadsQ = useQuery({
    queryKey: ["chat-threads"],
    queryFn: () => list(),
  });

  const createM = useMutation({
    mutationFn: () => create({ data: {} }),
    onSuccess: (t) => {
      qc.invalidateQueries({ queryKey: ["chat-threads"] });
      navigate({ to: "/chat/$threadId", params: { threadId: t.id } });
    },
  });

  // Auto-redirect to most recent thread when there is one
  useEffect(() => {
    if (threadsQ.data && threadsQ.data.length > 0) {
      navigate({ to: "/chat/$threadId", params: { threadId: threadsQ.data[0].id }, replace: true });
    }
  }, [threadsQ.data, navigate]);

  if (threadsQ.isLoading) {
    return (
      <div className="grid h-[60vh] place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto grid min-h-[60vh] max-w-2xl place-items-center">
      <Card className="w-full p-10 text-center shadow-soft">
        <div className="mx-auto mb-4 w-fit"><BrandLogo size={56} /></div>
        <h1 className="text-xl font-semibold">Start a conversation</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Ask anything — drafting, planning, summarizing, brainstorming. Your conversations are saved to your account.
        </p>
        <Button
          className="mt-6 bg-gradient-primary text-primary-foreground"
          onClick={() => createM.mutate()}
          disabled={createM.isPending}
        >
          {createM.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MessageSquarePlus className="mr-2 h-4 w-4" />}
          New conversation
        </Button>
      </Card>
    </div>
  );
}
