"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Field";

export default function LoginPage() {
  const { login } = useAuth();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(phone, password);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError("Numéro ou mot de passe incorrect.");
      } else {
        setError("Impossible de se connecter. Vérifiez votre connexion.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mv-tide flex min-h-dvh flex-col items-center justify-center px-6 py-12">
      <div className="mb-10 flex flex-col items-center">
        <Image src="/brand/vp-logo.png" alt="Vêtement Palace" width={120} height={120} priority className="mb-4" />
        <p className="eyebrow !text-gold-light">Espace atelier</p>
        <h1 className="serif mt-2 text-3xl text-[#fff]">Mansa Vibes</h1>
        <p className="mt-2 text-sm text-[#fff]/60">Votre atelier, à la voix.</p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-3xl bg-bg-card p-6 shadow-2xl">
        <div className="mb-4">
          <Label htmlFor="phone">Téléphone</Label>
          <Input
            id="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="74 33 59 05"
          />
        </div>
        <div className="mb-6">
          <Label htmlFor="password">Mot de passe</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        {error && <p className="mb-4 text-sm text-danger">{error}</p>}

        <Button type="submit" variant="gold" size="lg" fullWidth disabled={loading}>
          {loading ? "Connexion…" : "Se connecter"}
        </Button>
      </form>
    </main>
  );
}
