"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { SocialButtons } from "@/components/Auth/SocialButtons";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const registered = await register(username, email, password);
      if (registered.isVerified) {
        router.push("/");
      } else {
        router.push(`/verify-email?email=${encodeURIComponent(registered.email)}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-sm mx-auto">
      <h1 className="font-mono text-2xl font-bold mb-8">Create account</h1>
      <SocialButtons />
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-xs font-mono uppercase text-dim mb-1.5">Username</label>
          <Input value={username} onChange={(e) => setUsername(e.target.value)} minLength={3} maxLength={20} required />
        </div>
        <div>
          <label className="block text-xs font-mono uppercase text-dim mb-1.5">Email</label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="block text-xs font-mono uppercase text-dim mb-1.5">Password</label>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required />
          <p className="text-dim text-xs mt-1">At least 8 characters.</p>
        </div>
        {error && <p className="text-danger text-sm font-mono">{error}</p>}
        <Button type="submit" disabled={submitting} className="mt-2">
          {submitting ? "Creating account..." : "Sign up"}
        </Button>
      </form>
      <p className="text-dim text-sm mt-6">
        Already have an account?{" "}
        <Link href="/login" className="text-accent">
          Log in
        </Link>
      </p>
    </div>
  );
}
