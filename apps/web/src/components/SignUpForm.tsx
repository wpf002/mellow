"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signUp } from "@/lib/auth-client";
import { Button, Card, Field, Input } from "./ui";

export function SignUpForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await signUp.email({ name, email, password });
    setLoading(false);
    if (error) {
      setError(error.message ?? "Could not create account");
      return;
    }
    router.push("/onboarding");
    router.refresh();
  }

  return (
    <Card className="w-full max-w-sm p-6">
      <h1 className="text-xl font-bold">Create your account</h1>
      <p className="mt-1 text-sm text-muted">Join Mellow — the 100% free prayer app.</p>
      <form onSubmit={onSubmit} className="mt-5 space-y-4">
        <Field label="Name">
          <Input value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
        </Field>
        <Field label="Email">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </Field>
        <Field label="Password" hint="At least 8 characters">
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
          />
        </Field>
        {error && <p className="text-sm text-brand">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Creating…" : "Sign up"}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/sign-in" className="font-medium text-brand">
          Sign in
        </Link>
      </p>
    </Card>
  );
}
