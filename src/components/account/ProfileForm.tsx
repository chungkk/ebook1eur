"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Loader2, Check, X, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Profile {
  name: string;
  email: string;
}

export default function ProfileForm() {
  const { data: session, update } = useSession();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/user/profile");
      const data = await response.json();

      if (data.success) {
        setProfile(data.data);
        setName(data.data.name);
      }
    } catch {
      setError("Kontoinformationen konnten nicht geladen werden");
    } finally {
      setLoading(false);
    }
  };

  const passwordChecks = {
    length: newPassword.length >= 8,
    uppercase: /[A-Z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
    match: newPassword === confirmPassword && newPassword.length > 0,
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (changingPassword) {
      if (!passwordChecks.length || !passwordChecks.uppercase || !passwordChecks.number) {
        setError("Das neue Passwort erfüllt nicht die Anforderungen");
        return;
      }
      if (newPassword !== confirmPassword) {
        setError("Passwörter stimmen nicht überein");
        return;
      }
    }

    setSaving(true);

    try {
      const body: Record<string, string> = {};
      if (name !== profile?.name) {
        body.name = name;
      }
      if (changingPassword && newPassword) {
        body.currentPassword = currentPassword;
        body.newPassword = newPassword;
      }

      if (Object.keys(body).length === 0) {
        setSuccess("Keine Änderungen");
        setSaving(false);
        return;
      }

      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error);
        return;
      }

      setSuccess("Erfolgreich aktualisiert");
      setProfile(data.data);

      // Update session if name changed
      if (body.name) {
        await update({ name: body.name });
      }

      // Reset password fields
      if (changingPassword) {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setChangingPassword(false);
      }
    } catch {
      setError("Ein Fehler ist aufgetreten");
    } finally {
      setSaving(false);
    }
  };

  const CheckItem = ({ checked, text }: { checked: boolean; text: string }) => (
    <div className={`flex items-center gap-2 text-sm ${checked ? "text-green-600" : "text-ink-400"}`}>
      {checked ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
      {text}
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-leather-600" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          {success}
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={saving}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">E-Mail</Label>
          <Input id="email" value={profile?.email || ""} disabled />
          <p className="text-xs text-ink-500">E-Mail kann nicht geändert werden</p>
        </div>
      </div>

      {/* Password Change Section */}
      <div className="border-t border-parchment-200 pt-6">
        {!changingPassword ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => setChangingPassword(true)}
          >
            Passwort ändern
          </Button>
        ) : (
          <div className="space-y-4">
            <h3 className="font-medium text-leather-800">Passwort ändern</h3>

            <div className="space-y-2">
              <Label htmlFor="currentPassword">Aktuelles Passwort</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showPasswords ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={saving}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(!showPasswords)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400"
                >
                  {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">Neues Passwort</Label>
              <Input
                id="newPassword"
                type={showPasswords ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={saving}
              />
              <div className="space-y-1 mt-2">
                <CheckItem checked={passwordChecks.length} text="Mindestens 8 Zeichen" />
                <CheckItem checked={passwordChecks.uppercase} text="Mindestens 1 Großbuchstabe" />
                <CheckItem checked={passwordChecks.number} text="Mindestens 1 Zahl" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Neues Passwort bestätigen</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={saving}
              />
              {confirmPassword && (
                <CheckItem checked={passwordChecks.match} text="Passwörter stimmen überein" />
              )}
            </div>

            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setChangingPassword(false);
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
              }}
            >
              Passwortänderung abbrechen
            </Button>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Wird gespeichert...
            </>
          ) : (
            "Änderungen speichern"
          )}
        </Button>
      </div>
    </form>
  );
}
