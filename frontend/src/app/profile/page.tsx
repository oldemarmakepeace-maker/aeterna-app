"use client";

/**
 * AETERNA — Profile Page.
 * Управление категориями: список, добавление, удаление.
 * Quiet Luxury дизайн.
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import { getRankByXp, RANKS } from "@/lib/constants";
import { useCategoriesContext } from "@/lib/CategoryContext";
import { useAuth } from "@/lib/AuthContext";

const spring = { type: "spring" as const, stiffness: 380, damping: 28 };
const overlaySpring = { type: "spring" as const, stiffness: 300, damping: 30 };

const RANK_ICONS: Record<string, string> = {
  "Операционный": "⚙️",
  "Тактический": "🎯",
  "Стратегический": "🏛️",
  "Элита": "🔱",
};

// Предустановленные эмодзи
const EMOJI_PRESETS = [
  "💼","🏋️","🤝","🌿","📊","🚀","📚","🎨","🏠","✈️",
  "🧘","🎵","🍎","💡","⚡","🌊","🎯","🔬","🌱","💎",
  "🤖","🎮","📱","🏆","🌙","☀️","🔥","💪","🧠","🎤",
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "_")
    .replace(/-+/g, "_")
    .slice(0, 32)
    || `cat_${Date.now()}`;
}

// ── Add Category Sheet ────────────────────────────────────────
function AddCategorySheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [label, setLabel] = useState("");
  const [icon, setIcon] = useState("📋");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { createCategory } = useCategoriesContext();

  const handleSubmit = async () => {
    const trimmed = label.trim();
    if (!trimmed) { setError("Введите название категории"); return; }

    setLoading(true);
    setError("");
    try {
      const slug = slugify(trimmed);
      await createCategory(slug, trimmed, icon);
      setLabel("");
      setIcon("📋");
      onClose();
    } catch (e: any) {
      const msg = e?.message || "";
      if (msg.includes("409") || msg.includes("уже существует")) {
        setError("Категория с таким названием уже есть");
      } else {
        setError("Ошибка сервера. Попробуйте снова.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[110] flex items-end justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            className="relative w-full max-w-md bg-surface-1 border border-gunmetal rounded-t-3xl px-6 pb-10 pt-4"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={overlaySpring}
            onClick={e => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="flex justify-center mb-4">
              <div className="w-10 h-1 rounded-full bg-gunmetal-light" />
            </div>

            <h3 className="font-serif text-lg text-text-primary mb-5">Новая категория</h3>

            {/* Icon picker */}
            <p className="text-[11px] text-text-muted uppercase tracking-wider mb-2 font-sans">Иконка</p>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-copper/10 border-2 border-copper/30 flex items-center justify-center text-2xl flex-shrink-0">
                {icon}
              </div>
              <div className="flex flex-wrap gap-1.5 flex-1">
                {EMOJI_PRESETS.map(e => (
                  <motion.button
                    key={e}
                    type="button"
                    whileTap={{ scale: 0.8 }}
                    transition={spring}
                    onClick={() => setIcon(e)}
                    className={`w-8 h-8 rounded-lg text-lg flex items-center justify-center transition-all ${
                      icon === e
                        ? "bg-copper/20 border border-copper/50"
                        : "bg-surface-2 border border-gunmetal/40 hover:border-gunmetal-light"
                    }`}
                  >
                    {e}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Name input */}
            <p className="text-[11px] text-text-muted uppercase tracking-wider mb-2 font-sans">Название</p>
            <input
              type="text"
              value={label}
              onChange={e => { setLabel(e.target.value); setError(""); }}
              placeholder="Например: Спорт, Творчество..."
              maxLength={50}
              className="w-full bg-surface-2 border border-gunmetal rounded-xl px-4 py-3 text-sm text-text-primary placeholder-text-muted font-sans outline-none focus:border-copper/50 transition-colors mb-2"
              id="new-cat-label"
              onKeyDown={e => { if (e.key === "Enter") handleSubmit(); }}
            />

            {/* Slug preview */}
            {label.trim() && (
              <p className="text-[10px] text-text-muted font-mono mb-3">
                slug: <span className="text-copper-dark">{slugify(label.trim())}</span>
              </p>
            )}

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-xs text-red-400/80 font-sans mb-3"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            {/* Buttons */}
            <div className="flex gap-3 mt-2">
              <motion.button
                whileTap={{ scale: 0.95 }}
                transition={spring}
                onClick={onClose}
                className="flex-1 py-3.5 rounded-xl bg-surface-2 border border-gunmetal text-text-secondary text-sm font-sans"
                id="cat-cancel"
              >
                Отмена
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                transition={spring}
                onClick={handleSubmit}
                disabled={loading}
                className={`flex-1 py-3.5 rounded-xl text-sm font-sans font-medium transition-all ${
                  loading
                    ? "bg-copper/20 text-copper/50 cursor-not-allowed"
                    : "bg-copper text-surface-1 hover:bg-copper-light"
                }`}
                id="cat-submit"
              >
                {loading ? "Создаю..." : "Создать"}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function ProfilePage() {
  const [showAdd, setShowAdd] = useState(false);
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const { categories, loading, deleteCategory } = useCategoriesContext();
  const { session, signOut } = useAuth();

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

  const fetchProfile = async () => {
    if (!session?.access_token) return;
    try {
      const res = await fetch(`${API_URL}/api/v1/auth/login`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        setProfile(await res.json());
      }
    } catch (e) {
      console.error("Profile fetch error:", e);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [session]);

  const handleDelete = async (slug: string) => {
    setDeletingSlug(slug);
    try {
      await deleteCategory(slug);
    } catch (e) {
      console.error("Delete failed:", e);
    } finally {
      setDeletingSlug(null);
    }
  };

  return (
    <>
      <motion.main
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring}
        className="relative max-w-md lg:max-w-5xl mx-auto px-4 pb-28 lg:pb-12 min-h-dvh pt-2 lg:pt-8"
      >
        <div className="lg:hidden">
            <Header />
        </div>

        {/* Avatar */}
        <div className="flex flex-col items-center py-8">
          <div className="w-20 h-20 rounded-full bg-surface-2 border-2 border-copper flex items-center justify-center text-3xl mb-3 shadow-lg shadow-copper/10">
            {profile?.display_name?.[0]?.toUpperCase() || "👤"}
          </div>
          <h1 className="font-serif text-xl text-text-primary">
            {profile?.display_name || "Загрузка..."}
          </h1>
          <p className="text-xs text-text-muted font-mono mt-1">
            {profile?.current_rank || "Ранг..."}
          </p>
          <button 
            onClick={() => signOut()}
            className="mt-4 text-[10px] text-text-muted hover:text-red-400 transition-colors uppercase tracking-widest"
          >
            Выйти из системы
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-12 mt-4 lg:mt-10">
            {/* ── Categories Section ────────────────────────────── */}
            <section className="mb-8 lg:mb-0">
            <div className="flex items-center justify-between mb-4">
                <p className="text-[11px] text-text-muted uppercase tracking-widest font-sans">
                Категории
                </p>
                <motion.button
                whileTap={{ scale: 0.88 }}
                transition={spring}
                onClick={() => setShowAdd(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-copper/10 border border-copper/30 text-copper text-[12px] font-sans hover:bg-copper/15 transition-colors"
                id="add-category-btn"
                >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M12 5v14M5 12h14" />
                </svg>
                Добавить
                </motion.button>
            </div>

            {loading ? (
                <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-gunmetal-light border-t-copper rounded-full animate-spin" />
                </div>
            ) : (
                <motion.div layout className="rounded-2xl border border-gunmetal/50 overflow-hidden shadow-lg shadow-black/10">
                <AnimatePresence initial={false}>
                    {categories.map((cat, i) => (
                    <motion.div
                        key={cat.slug}
                        layout
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={spring}
                        className={`flex items-center gap-3 px-4 py-3.5 bg-surface-2 ${
                        i < categories.length - 1 ? "border-b border-gunmetal/30" : ""
                        }`}
                    >
                        <span className="text-xl w-7 text-center flex-shrink-0">{cat.icon}</span>
                        <div className="flex-1 min-w-0">
                        <p className="text-sm font-sans text-text-primary">{cat.label}</p>
                        <p className="text-[10px] font-mono text-text-muted">{cat.slug}</p>
                        </div>
                        <motion.button
                        whileTap={{ scale: 0.78 }}
                        transition={spring}
                        onClick={() => handleDelete(cat.slug)}
                        disabled={deletingSlug === cat.slug}
                        className="w-7 h-7 rounded-full bg-surface-3/60 border border-gunmetal/50 flex items-center justify-center text-text-muted hover:text-red-400 hover:border-red-400/30 transition-colors disabled:opacity-40"
                        id={`delete-cat-${cat.slug}`}
                        aria-label={`Удалить категорию ${cat.label}`}
                        >
                        {deletingSlug === cat.slug ? (
                            <span className="w-3 h-3 border border-text-muted border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                        )}
                        </motion.button>
                    </motion.div>
                    ))}

                    {categories.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="px-4 py-8 text-center bg-surface-2"
                    >
                        <p className="text-3xl mb-2">📂</p>
                        <p className="text-sm text-text-muted font-sans">Нет категорий. Добавьте первую.</p>
                    </motion.div>
                    )}
                </AnimatePresence>
                </motion.div>
            )}

            <p className="text-[10px] text-text-muted font-sans mt-3 text-center">
                Категории отображаются во всех задачах и аналитике
            </p>
            </section>

            {/* ── Ranks Section ─────────────────────────────────── */}
            <section className="mb-6">
            <p className="text-[11px] text-text-muted uppercase tracking-widest mb-4 font-sans">
                Система рангов
            </p>
            <div className="space-y-3">
                {RANKS.map((rank) => (
                <div
                    key={rank.name}
                    className="flex items-center gap-3 bg-surface-2 border border-gunmetal/50 rounded-2xl px-5 py-4 shadow-lg shadow-black/10"
                >
                    <span className="text-2xl">{RANK_ICONS[rank.name]}</span>
                    <div className="flex-1">
                    <p className="text-[15px] font-sans text-text-primary">{rank.name}</p>
                    <p className="text-[11px] mt-0.5 text-text-muted font-mono">
                        {rank.threshold.toLocaleString()} XP
                        {rank.next !== null ? ` — ${rank.next.toLocaleString()} XP` : "+"}
                    </p>
                    </div>
                </div>
                ))}
            </div>
            </section>
        </div>
      </motion.main>

      <BottomNav />
      <AddCategorySheet open={showAdd} onClose={() => setShowAdd(false)} />
    </>
  );
}
