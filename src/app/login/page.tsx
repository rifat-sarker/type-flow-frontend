"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { SocialButtons } from "@/components/Auth/SocialButtons";

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // OAuth failures come back as ?error= on this page.
  useEffect(() => {
    const e = searchParams.get("error");
    if (e) setError(e);
  }, [searchParams]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(emailOrUsername, password);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-sm mx-auto">
      <h1 className="font-mono text-2xl font-bold mb-8">Log in</h1>
      <SocialButtons />
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-xs font-mono uppercase text-dim mb-1.5">Email or username</label>
          <Input value={emailOrUsername} onChange={(e) => setEmailOrUsername(e.target.value)} required />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-mono uppercase text-dim">Password</label>
            <Link href="/forgot-password" className="text-xs font-mono text-dim hover:text-accent">
              Forgot password?
            </Link>
          </div>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        {error && <p className="text-danger text-sm font-mono">{error}</p>}
        <Button type="submit" disabled={submitting} className="mt-2">
          {submitting ? "Logging in..." : "Log in"}
        </Button>
      </form>
      <p className="text-dim text-sm mt-6">
        No account?{" "}
        <Link href="/register" className="text-accent">
          Sign up
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
