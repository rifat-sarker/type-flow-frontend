"use client";

import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

function VerifyEmailForm() {
  const { verifyOtp, resendOtp } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await verifyOtp(email, code);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function onResend() {
    setError(null);
    setNotice(null);
    setResending(true);
    try {
      await resendOtp(email, "verify");
      setNotice("A new code has been sent.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend code");
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="max-w-sm mx-auto">
      <h1 className="font-mono text-2xl font-bold mb-2">Verify your email</h1>
      <p className="text-dim text-sm mb-8">
        We sent a 6-digit code to <span className="text-text">{email || "your email"}</span>.
      </p>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-xs font-mono uppercase text-dim mb-1.5">Code</label>
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            inputMode="numeric"
            maxLength={6}
            placeholder="123456"
            required
            autoFocus
          />
        </div>
        {error && <p className="text-danger text-sm font-mono">{error}</p>}
        {notice && <p className="text-success text-sm font-mono">{notice}</p>}
        <Button type="submit" disabled={submitting || code.length !== 6} className="mt-2">
          {submitting ? "Verifying..." : "Verify"}
        </Button>
      </form>
      <button
        onClick={onResend}
        disabled={resending || !email}
        className="text-dim text-sm mt-6 hover:text-accent disabled:opacity-50"
      >
        {resending ? "Sending..." : "Resend code"}
      </button>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailForm />
    </Suspense>
  );
}
