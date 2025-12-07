"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, ArrowLeft, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || "Ein Fehler ist aufgetreten");
        return;
      }

      setSuccess(true);
    } catch {
      setError("Ein Fehler ist aufgetreten, bitte versuchen Sie es erneut");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center space-y-4">
        <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="h-6 w-6 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-leather-800">
          Überprüfen Sie Ihre E-Mail
        </h3>
        <p className="text-ink-600 text-sm">
          Falls die E-Mail in unserem System existiert, erhalten Sie in wenigen Minuten einen Link zum Zurücksetzen des Passworts.
        </p>
        <Link href="/login">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück zur Anmeldung
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-ink-600 text-sm">
        Geben Sie Ihre E-Mail-Adresse ein und wir senden Ihnen einen Link zum Zurücksetzen des Passworts.
      </p>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

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

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Wird gesendet...
          </>
        ) : (
          "Link zum Zurücksetzen senden"
        )}
      </Button>

      <Link
        href="/login"
        className="flex items-center justify-center text-sm text-ink-600 hover:text-leather-600"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Zurück zur Anmeldung
      </Link>
    </form>
  );
}
