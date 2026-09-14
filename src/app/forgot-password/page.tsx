"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function ForgotPasswordPage() {
  const { forgotPassword, resetPassword } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<"request" | "reset">("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onRequest(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await forgotPassword(email);
      setStep("reset");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send code");
    } finally {
      setSubmitting(false);
    }
  }

  async function onReset(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await resetPassword(email, code, newPassword);
      router.push("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (step === "request") {
    return (
      <div className="max-w-sm mx-auto">
        <h1 className="font-mono text-2xl font-bold mb-2">Forgot password</h1>
        <p className="text-dim text-sm mb-8">Enter your email and we&apos;ll send a reset code.</p>
        <form onSubmit={onRequest} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-mono uppercase text-dim mb-1.5">Email</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
          </div>
          {error && <p className="text-danger text-sm font-mono">{error}</p>}
          <Button type="submit" disabled={submitting} className="mt-2">
            {submitting ? "Sending..." : "Send code"}
          </Button>
        </form>
        <p className="text-dim text-sm mt-6">
          <Link href="/login" className="text-accent">
            Back to log in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto">
      <h1 className="font-mono text-2xl font-bold mb-2">Reset password</h1>
      <p className="text-dim text-sm mb-8">
        Enter the code sent to <span className="text-text">{email}</span> and a new password.
      </p>
      <form onSubmit={onReset} className="flex flex-col gap-4">
        <div>
          <label className="block text-xs font-mono uppercase text-dim mb-1.5">Code</label>
          <Input value={code} onChange={(e) => setCode(e.target.value)} inputMode="numeric" maxLength={6} required autoFocus />
        </div>
        <div>
          <label className="block text-xs font-mono uppercase text-dim mb-1.5">New password</label>
          <Input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            minLength={8}
            required
          />
        </div>
        {error && <p className="text-danger text-sm font-mono">{error}</p>}
        <Button type="submit" disabled={submitting} className="mt-2">
          {submitting ? "Resetting..." : "Reset password"}
        </Button>
      </form>
      <button onClick={() => setStep("request")} className="text-dim text-sm mt-6 hover:text-accent">
        Use a different email
      </button>
    </div>
  );
}
