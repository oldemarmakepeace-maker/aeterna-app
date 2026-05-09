"use client";

/**
 * AETERNA — Dashboard Page.
 * Главная страница: утренняя сводка.
 * Компоновка Desktop: Сетка (Grid) с левой и правой колонками.
 * Компоновка Mobile: Вертикальная.
 * Анимации: Framer Motion spring (stiffness:300, damping:30).
 */

import { motion } from "framer-motion";
import Header from "@/components/layout/Header";
import MagicInputBar from "@/components/dashboard/MagicInputBar";
import ProductivityRadar from "@/components/dashboard/ProductivityRadar";
import XpProgressBar from "@/components/dashboard/XpProgressBar";
import CalendarWidget from "@/components/dashboard/CalendarWidget";
import TaskList from "@/components/dashboard/TaskList";
import BottomNav from "@/components/layout/BottomNav";

const spring = { type: "spring" as const, stiffness: 300, damping: 30 };
const springFast = { type: "spring" as const, stiffness: 400, damping: 25 };

// Stagger container — дочерние элементы появляются по очереди
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: spring,
  },
};

export default function DashboardPage() {
  return (
    <>
      <motion.main
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring}
        className="relative px-4 pb-28 lg:pb-12 min-h-dvh max-w-md md:max-w-3xl lg:max-w-6xl mx-auto pt-2 lg:pt-8"
      >
        {/* ── Header ─────────────────────────────────────── */}
        <Header />

        <motion.div
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* ── Левая колонка (Задачи и расписание) ───────── */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <motion.section variants={itemVariants}>
              <MagicInputBar />
            </motion.section>

            <motion.section variants={itemVariants}>
              <CalendarWidget />
            </motion.section>

            <motion.section variants={itemVariants}>
              <TaskList />
            </motion.section>
          </div>

          {/* ── Правая колонка (Аналитика) ─────────────────── */}
          <motion.div
            className="lg:col-span-5 flex flex-col gap-6"
            variants={itemVariants}
          >
            <motion.section
              whileHover={{ scale: 1.005 }}
              transition={springFast}
              className="bg-surface-2/50 rounded-3xl border border-gunmetal/30 p-4 lg:p-6 shadow-xl shadow-black/20"
            >
              <h2 className="text-[11px] text-text-muted uppercase tracking-widest font-sans mb-6">
                Баланс
              </h2>
              <ProductivityRadar />

              <div className="mt-8 border-t border-gunmetal/40 pt-6">
                <XpProgressBar />
              </div>
            </motion.section>
          </motion.div>
        </motion.div>
      </motion.main>

      {/* ── Bottom Navigation ────────────────────────────── */}
      <BottomNav />
    </>
  );
}
