"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Eye, EyeOff, Loader2 } from "lucide-react";
import { coreShieldApi, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { token } = await coreShieldApi.login(username, password);
      window.localStorage.setItem("coreshield_token", token);
      router.push("/");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to reach the server"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background px-4 overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(var(--border-subtle) 1px, transparent 1px), linear-gradient(90deg, var(--border-subtle) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage:
            "radial-gradient(ellipse 60% 50% at 50% 40%, black 0%, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 60% 50% at 50% 40%, black 0%, transparent 75%)",
          opacity: 0.5,
        }}
      />
      <div
        className="pointer-events-none absolute w-[480px] h-[480px] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, var(--accent) 0%, transparent 70%)",
          opacity: 0.08,
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      />

      <div className="relative w-full max-w-sm animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-accent-muted border border-accent/20">
            <span className="absolute inset-0 rounded-xl bg-accent/10 animate-pulse" />
            <ShieldCheck className="relative w-6 h-6 text-accent" />
          </div>
          <div className="text-center">
            <h1 className="text-lg font-semibold tracking-tight text-foreground">
              CoreShield
            </h1>
            <p className="text-xs text-foreground-subtle mt-0.5">
              Sign in to your security dashboard
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-surface/80 backdrop-blur border border-border rounded-lg p-6 space-y-4 shadow-2xl shadow-black/20"
        >
          <div className="space-y-1.5">
            <label
              htmlFor="username"
              className="text-xs font-medium text-foreground-muted"
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
              className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-foreground-subtle transition-colors focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/40"
              placeholder="admin"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="text-xs font-medium text-foreground-muted"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full h-9 rounded-md border border-border bg-background px-3 pr-9 text-sm text-foreground placeholder:text-foreground-subtle transition-colors focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/40"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
                className="absolute right-0 top-0 h-9 w-9 flex items-center justify-center text-foreground-subtle hover:text-foreground-muted transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="w-3.5 h-3.5" />
                ) : (
                  <Eye className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-xs text-danger bg-danger-muted border border-danger/20 rounded-md px-3 py-2 animate-in fade-in slide-in-from-top-1 duration-200">
              {error}
            </p>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Signing in…
              </>
            ) : (
              "Sign in"
            )}
          </Button>
        </form>

        <p className="text-center text-xs text-foreground-subtle mt-6">
          Protected by CoreShield · Session encrypted end-to-end
        </p>
      </div>
    </div>
  );
}
