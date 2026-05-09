"use client";

/**
 * AETERNA — Bottom Navigation с маршрутизацией.
 * Использует Next.js useRouter для навигации между страницами.
 */

import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";

const springConfig = { type: "spring" as const, stiffness: 400, damping: 25 };

const NAV_ITEMS = [
  {
    id: "dashboard",
    label: "Обзор",
    href: "/",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    id: "calendar",
    label: "Календарь",
    href: "/calendar",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    id: "analytics",
    label: "Аналитика",
    href: "/analytics",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
  {
    id: "profile",
    label: "Профиль",
    href: "/profile",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  const getActiveId = () => {
    if (pathname === "/") return "dashboard";
    if (pathname.startsWith("/calendar")) return "calendar";
    if (pathname.startsWith("/analytics")) return "analytics";
    if (pathname.startsWith("/profile")) return "profile";
    return "dashboard";
  };

  const activeId = getActiveId();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface-1/90 backdrop-blur-xl border-t border-gunmetal/50 safe-bottom"
      id="bottom-nav"
    >
      <div className="flex items-center justify-around max-w-md mx-auto py-2">
        {NAV_ITEMS.map((item) => {
          const isActive = activeId === item.id;
          return (
            <motion.button
              key={item.id}
              onClick={() => router.push(item.href)}
              whileTap={{ scale: 0.85 }}
              transition={springConfig}
              className={`
                relative flex flex-col items-center gap-0.5 px-4 py-1.5
                transition-colors
                ${isActive ? "text-copper" : "text-text-muted hover:text-text-secondary"}
              `}
              id={`nav-${item.id}`}
            >
              {item.icon}
              <span className="text-[10px] font-sans tracking-wide">
                {item.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  transition={springConfig}
                  className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-copper"
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
}
