"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Eye, EyeOff, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const passwordChecks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    match: password === confirmPassword && password.length > 0,
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!passwordChecks.length || !passwordChecks.uppercase || !passwordChecks.number) {
      setError("Passwort erfüllt nicht die Anforderungen");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwörter stimmen nicht überein");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || "Registrierung fehlgeschlagen");
        return;
      }

      // Auto login after registration
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        router.push("/login");
      } else {
        router.push("/books");
        router.refresh();
      }
    } catch {
      setError("Ein Fehler ist aufgetreten, bitte versuchen Sie es erneut");
    } finally {
      setLoading(false);
    }
  };

  const CheckItem = ({ checked, text }: { checked: boolean; text: string }) => (
    <div className={`flex items-center gap-2 text-sm ${checked ? "text-green-600" : "text-ink-400"}`}>
      {checked ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
      {text}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          type="text"
          placeholder="Max Mustermann"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">E-Mail</Label>
        <Input
          id="email"
          type="email"
          placeholder="email@beispiel.de"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Passwort</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <div className="space-y-1 mt-2">
          <CheckItem checked={passwordChecks.length} text="Mindestens 8 Zeichen" />
          <CheckItem checked={passwordChecks.uppercase} text="Mindestens 1 Großbuchstabe" />
          <CheckItem checked={passwordChecks.number} text="Mindestens 1 Zahl" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          disabled={loading}
        />
        {confirmPassword && (
          <CheckItem checked={passwordChecks.match} text="Passwörter stimmen überein" />
        )}
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Registrierung läuft...
          </>
        ) : (
          "Registrieren"
        )}
      </Button>

      <p className="text-center text-sm text-ink-600">
        Bereits ein Konto?{" "}
        <Link href="/login" className="text-leather-600 hover:text-leather-700 font-medium">
          Anmelden
        </Link>
      </p>
    </form>
  );
}
