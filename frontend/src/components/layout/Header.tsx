"use client";

/**
 * AETERNA — Header.
 * Шапка дашборда: логотип, дата, аватар.
 */

import { motion } from "framer-motion";

const springConfig = { type: "spring" as const, stiffness: 400, damping: 25 };

function formatDate(): string {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    day: "numeric",
    month: "long",
  };
  const formatted = now.toLocaleDateString("ru-RU", options);
  // Capitalize first letter
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return "Доброй ночи";
  if (hour < 12) return "Доброе утро";
  if (hour < 18) return "Добрый день";
  return "Добрый вечер";
}

export default function Header() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springConfig}
      className="flex items-center justify-between py-4"
    >
      {/* Left: Branding */}
      <div>
        <h1 className="font-serif text-2xl text-copper tracking-wide">
          AETERNA
        </h1>
        <p className="text-xs text-text-muted font-sans mt-0.5">
          {getGreeting()} · {formatDate()}
        </p>
      </div>

      {/* Right: Avatar */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        transition={springConfig}
        className="w-10 h-10 rounded-full bg-surface-2 border border-gunmetal flex items-center justify-center text-text-secondary hover:border-copper/30 transition-colors"
        id="avatar-button"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </motion.button>
    </motion.header>
  );
}
