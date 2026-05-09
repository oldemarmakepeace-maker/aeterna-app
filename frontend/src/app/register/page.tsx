"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

const spring = { type: "spring" as const, stiffness: 400, damping: 25 };

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
        },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/");
    }
  };

  return (
    <div className="min-h-dvh flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={spring}
        className="w-full max-w-sm bg-surface-2/40 border border-gunmetal/30 p-8 rounded-3xl backdrop-blur-xl shadow-2xl shadow-black/40"
      >
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl text-text-primary tracking-wide mb-2 text-copper">AETERNA</h1>
          <p className="font-sans text-xs text-text-muted uppercase tracking-widest">Новый профиль</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-5">
          <div>
            <label className="block text-[11px] text-text-muted uppercase tracking-wider mb-2" htmlFor="displayName">
              Имя
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-surface-1 border border-gunmetal/50 rounded-xl px-4 py-3 text-sm text-text-primary outline-none focus:border-copper transition-colors"
              placeholder="Entrepreneur"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] text-text-muted uppercase tracking-wider mb-2" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-surface-1 border border-gunmetal/50 rounded-xl px-4 py-3 text-sm text-text-primary outline-none focus:border-copper transition-colors"
              placeholder="ceo@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] text-text-muted uppercase tracking-wider mb-2" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-surface-1 border border-gunmetal/50 rounded-xl px-4 py-3 text-sm text-text-primary outline-none focus:border-copper transition-colors"
              placeholder="Мин. 6 символов"
              required
              minLength={6}
            />
          </div>

          {error && (
            <p className="text-red-400 text-xs text-center">{error}</p>
          )}

          <motion.button
            whileTap={{ scale: 0.97 }}
            transition={spring}
            type="submit"
            disabled={loading}
            className="w-full bg-copper hover:bg-copper-light text-surface-1 font-medium text-sm py-3.5 rounded-xl transition-colors disabled:opacity-50 mt-4 h-[48px] flex items-center justify-center"
          >
            {loading ? <div className="w-5 h-5 border-2 border-surface-1 border-t-transparent rounded-full animate-spin" /> : "Создать аккаунт"}
          </motion.button>
        </form>

        <p className="mt-8 text-center text-xs text-text-secondary font-sans border-t border-gunmetal/30 pt-6">
          Уже есть аккаунт?{" "}
          <Link href="/login" className="text-copper hover:text-copper-light transition-colors">
            Войти
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
