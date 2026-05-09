"use client";

/**
 * AETERNA — XP Progress Bar.
 * Горизонтальная полоса прогресса до следующего бизнес-ранга.
 * Использует useProductivityIndex (SWR) — без дублирующего API-вызова.
 */

import { motion } from "framer-motion";
import { getRankByXp } from "@/lib/constants";
import { useAuth } from "@/lib/AuthContext";
import { useProductivityIndex } from "@/lib/hooks";

const springConfig = { type: "spring" as const, stiffness: 300, damping: 30 };

export default function XpProgressBar() {
  const { session } = useAuth();
  const { totalXp, isLoading } = useProductivityIndex(session?.access_token);

  const rank = getRankByXp(totalXp);
  const progress = rank.next
    ? ((totalXp - rank.threshold) / (rank.next - rank.threshold)) * 100
    : 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springConfig, delay: 0.15 }}
      className="glass-card p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="font-serif text-base text-text-primary">
            Капитализация
          </span>
          <motion.span
            key={rank.name}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={springConfig}
            className="px-2 py-0.5 rounded-md bg-copper/10 text-copper text-[10px] font-mono uppercase tracking-wider"
          >
            {rank.name || "ОПЕРАЦИОННЫЙ"}
          </motion.span>
        </div>
        <motion.span
          key={totalXp}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={springConfig}
          className="font-mono text-sm text-text-primary"
        >
          {isLoading ? "—" : totalXp.toLocaleString()}
          <span className="text-text-muted text-xs ml-1">XP</span>
        </motion.span>
      </div>

      {/* Progress Track */}
      <div className="relative h-2 bg-surface-3 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: "0%" }}
          animate={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
          transition={{ ...springConfig, delay: 0.4 }}
          className="absolute top-0 left-0 h-full rounded-full"
          style={{
            background:
              "linear-gradient(90deg, #8B5A2B 0%, #B87333 50%, #D4956B 100%)",
          }}
        />
        {/* Glow */}
        <motion.div
          initial={{ width: "0%" }}
          animate={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
          transition={{ ...springConfig, delay: 0.4 }}
          className="absolute top-0 left-0 h-full rounded-full blur-sm opacity-50"
          style={{
            background:
              "linear-gradient(90deg, #8B5A2B 0%, #B87333 50%, #D4956B 100%)",
          }}
        />
      </div>

      {/* Range labels */}
      <div className="flex items-center justify-between mt-2">
        <span className="text-[10px] text-text-muted font-mono">
          {rank.threshold.toLocaleString()}
        </span>
        {rank.next && (
          <span className="text-[10px] text-text-muted font-mono">
            {rank.next.toLocaleString()}
          </span>
        )}
      </div>
    </motion.div>
  );
}
