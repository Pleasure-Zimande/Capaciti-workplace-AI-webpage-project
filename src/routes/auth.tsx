import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in | Taskgenie" },
      { name: "description", content: "Sign in to your AI workplace productivity assistant." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate({ to: "/", replace: true });
  }, [loading, user, navigate]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  const onSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) toast.error(error.message);
    else navigate({ to: "/", replace: true });
  };

  const onSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    setBusy(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Account created. You're signed in.");
      navigate({ to: "/", replace: true });
    }
  };

  const onGoogle = async () => {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setBusy(false);
      toast.error(result.error.message || "Google sign-in failed");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/", replace: true });
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2 bg-gradient-subtle">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-primary p-12 text-primary-foreground lg:flex">
        <div
          className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-white/10 blur-3xl"
          aria-hidden
        />
        <div className="flex items-center gap-3">
          <BrandLogo size={40} />
          <div>
            <div className="text-lg font-semibold">Taskgenie</div>
            <div className="text-xs opacity-80">Productivity Assistant</div>
          </div>
        </div>
        <div className="relative space-y-4">
          <h2 className="text-3xl font-semibold leading-tight">
            Automate the busywork.
            <br />Win back your day.
          </h2>
          <p className="max-w-sm text-sm text-primary-foreground/80">
            Draft emails, summarize meetings, plan your week, and research any topic — all from one AI workspace.
          </p>
          <ul className="space-y-1.5 text-sm">
            <li>• Smart email generator</li>
            <li>• Meeting notes summarizer</li>
            <li>• Prioritized task planner</li>
            <li>• Research assistant + chatbot</li>
          </ul>
        </div>
        <p className="relative text-xs text-primary-foreground/70">
          AI-generated content may require human review.
        </p>
      </div>

      <div className="flex items-center justify-center p-6">
        <Card className="w-full max-w-md shadow-elegant">
          <CardHeader>
            <div className="mb-2 flex items-center gap-2 lg:hidden">
              <BrandLogo size={32} />
              <span className="text-sm font-semibold">Taskgenie</span>
            </div>
            <CardTitle>Welcome</CardTitle>
            <CardDescription>Sign in to your workspace or create an account.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="w-full"
              onClick={onGoogle}
              disabled={busy}
              type="button"
            >
              <GoogleIcon className="mr-2 h-4 w-4" />
              Continue with Google
            </Button>
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">or with email</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-1 rounded-md bg-muted p-1">
              <button
                type="button"
                onClick={() => setMode("signin")}
                className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${mode === "signin" ? "bg-background shadow-soft" : "text-muted-foreground hover:text-foreground"}`}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => setMode("signup")}
                className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${mode === "signup" ? "bg-background shadow-soft" : "text-muted-foreground hover:text-foreground"}`}
              >
                Sign up
              </button>
            </div>
            <form className="mt-4 space-y-3" onSubmit={mode === "signin" ? onSignIn : onSignUp}>
              <Field label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" />
              <Field
                label="Password"
                type="password"
                value={password}
                onChange={setPassword}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                placeholder={mode === "signup" ? "At least 8 characters" : undefined}
              />
              <Button type="submit" className="w-full bg-gradient-primary" disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === "signin" ? "Sign in" : "Create account"}
              </Button>
            </form>
            <p className="mt-4 text-center text-[11px] text-muted-foreground">
              By continuing, you agree to our terms. <Link to="/" className="underline">Back home</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({
  label, type, value, onChange, autoComplete, placeholder,
}: { label: string; type: string; value: string; onChange: (s: string) => void; autoComplete?: string; placeholder?: string }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        placeholder={placeholder}
        required
      />
    </div>
  );
}

function GoogleIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09Z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.99.66-2.25 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"/>
      <path fill="#FBBC05" d="M5.84 14.11A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.11V7.05H2.18A11 11 0 0 0 1 12c0 1.77.42 3.45 1.18 4.95l3.66-2.84Z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.07.56 4.21 1.65l3.16-3.16C17.45 2.15 14.97 1 12 1A11 11 0 0 0 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z"/>
    </svg>
  );
}
