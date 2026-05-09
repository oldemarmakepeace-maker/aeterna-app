"use client";

/**
 * AETERNA — Sidebar Navigation (Desktop).
 * Используется на экранах `md` и шире вместо BottomNav.
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

export default function Sidebar() {
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
    <aside className="hidden md:flex flex-col w-24 lg:w-64 fixed left-0 top-0 bottom-0 z-50 bg-surface-1/95 backdrop-blur-xl border-r border-gunmetal/50 pt-8 pb-6">
      <div className="flex items-center justify-center lg:justify-start lg:px-8 mb-12">
        <h1 className="font-serif text-xl lg:text-3xl text-copper tracking-widest uppercase">
          <span className="lg:hidden">AE</span>
          <span className="hidden lg:block">AETERNA</span>
        </h1>
      </div>

      <nav className="flex flex-col gap-2 px-4 lg:px-6 flex-1">
        {NAV_ITEMS.map((item) => {
          const isActive = activeId === item.id;
          return (
            <motion.button
              key={item.id}
              onClick={() => router.push(item.href)}
              whileTap={{ scale: 0.95 }}
              transition={springConfig}
              className={`
                relative flex items-center lg:justify-start justify-center gap-4 py-3 lg:px-4 rounded-xl
                transition-all group overflow-hidden
                ${isActive ? "bg-copper/10 text-copper" : "text-text-muted hover:text-text-primary hover:bg-surface-2"}
              `}
              id={`sidebar-nav-${item.id}`}
            >
              <div className="relative z-10 flex items-center justify-center">
                {item.icon}
              </div>
              <span className="hidden lg:block text-[13px] font-sans tracking-wide font-medium relative z-10">
                {item.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="sidebar-indicator"
                  transition={springConfig}
                  className="absolute inset-x-0 bottom-0 h-0.5 lg:inset-y-0 lg:left-0 lg:h-full lg:w-1 bg-copper rounded-r-md"
                />
              )}
            </motion.button>
          );
        })}
      </nav>
      
      <div className="mt-auto px-4 lg:px-6 flex justify-center lg:justify-start">
        <div className="w-10 h-10 lg:w-full rounded-full lg:rounded-xl border border-gunmetal/50 flex items-center justify-center hover:bg-surface-2 transition-colors cursor-pointer text-text-muted flex-shrink-0 lg:px-4 py-2 gap-3 lg:justify-start">
            <span className="text-xl">👤</span>
            <span className="hidden lg:block text-xs font-sans text-text-primary uppercase tracking-wider">Предприниматель</span>
        </div>
      </div>
    </aside>
  );
}
