import { createFileRoute, Link } from "@tanstack/react-router";
import { Mail, FileText, ListChecks, Search, MessageSquare, Sparkles, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand-logo";

export const Route = createFileRoute("/_app/")({
  head: () => ({
    meta: [
      { title: "Dashboard | Taskgenie" },
      { name: "description", content: "Your AI workplace productivity hub: email, notes, planning, research, and chat." },
    ],
  }),
  component: Dashboard,
});

const tools = [
  {
    to: "/email",
    title: "Smart Email Generator",
    description: "Craft polished emails tailored to your tone and audience.",
    icon: Mail,
    accent: "from-violet-500/20 to-indigo-500/10",
  },
  {
    to: "/notes",
    title: "Meeting Notes Summarizer",
    description: "Turn raw notes into key points, decisions, and action items.",
    icon: FileText,
    accent: "from-sky-500/20 to-cyan-500/10",
  },
  {
    to: "/planner",
    title: "AI Task Planner",
    description: "Prioritize and schedule your work with the Eisenhower matrix.",
    icon: ListChecks,
    accent: "from-emerald-500/20 to-teal-500/10",
  },
  {
    to: "/research",
    title: "AI Research Assistant",
    description: "Get structured briefs, insights, and next steps on any topic.",
    icon: Search,
    accent: "from-amber-500/20 to-orange-500/10",
  },
  {
    to: "/chat",
    title: "AI Chatbot",
    description: "Conversational assistant for everything in between.",
    icon: MessageSquare,
    accent: "from-fuchsia-500/20 to-pink-500/10",
  },
] as const;

function Dashboard() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      <section className="relative overflow-hidden rounded-2xl border bg-card p-6 shadow-soft md:p-10">
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gradient-primary opacity-20 blur-3xl"
          aria-hidden
        />
        <div className="relative flex flex-col items-start gap-5 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Powered by Lovable AI
            </div>
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Automate your busywork.
              <br className="hidden md:block" />
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Focus on the work that matters.
              </span>
            </h1>
            <p className="text-sm text-muted-foreground md:text-base">
              Five purpose-built AI tools to help you write, plan, summarize, and research — all in one workspace.
            </p>
          </div>
          <BrandLogo size={64} />
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="text-lg font-semibold">Your tools</h2>
            <p className="text-sm text-muted-foreground">Jump back in or try something new.</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((t) => (
            <Card
              key={t.to}
              className="group relative overflow-hidden border-border/60 transition-all hover:shadow-elegant hover:-translate-y-0.5"
            >
              <div
                className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${t.accent} opacity-0 transition-opacity group-hover:opacity-100`}
                aria-hidden
              />
              <CardHeader className="relative">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-accent text-accent-foreground">
                  <t.icon className="h-5 w-5" />
                </div>
                <CardTitle className="mt-3 text-base">{t.title}</CardTitle>
                <CardDescription>{t.description}</CardDescription>
              </CardHeader>
              <CardContent className="relative">
                <Button asChild variant="ghost" size="sm" className="-ml-2 text-primary">
                  <Link to={t.to}>
                    Open <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
