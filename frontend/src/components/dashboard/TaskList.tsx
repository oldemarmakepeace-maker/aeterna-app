"use client";

/**
 * AETERNA — Task List.
 * Список задач с группировкой: Непереносимые → Стратегические → Рутина.
 * Использует useSWR для автоматической ревалидации.
 */

import { useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TASK_XP } from "@/lib/constants";
import { useCategoriesContext } from "@/lib/CategoryContext";
import { useAuth } from "@/lib/AuthContext";
import { useTasks, invalidateAll } from "@/lib/hooks";
import { tasksApi } from "@/lib/api";

type TaskType = "routine" | "strategic" | "hard_block";

const springConfig = { type: "spring" as const, stiffness: 400, damping: 25 };

// ── Type badge meta ──────────────────────────────────────────
const TYPE_BADGE: Record<TaskType, { icon: string; label: string }> = {
  routine: { icon: "🔄", label: "Рутина" },
  strategic: { icon: "🎯", label: "Стратег." },
  hard_block: { icon: "🔒", label: "Hard Block" },
};

// ── Importance meta ──────────────────────────────────────────
const IMPORTANCE_DOT: Record<string, string> = {
  none:   "",
  low:    "bg-text-secondary",
  medium: "bg-copper-dark",
  high:   "bg-copper",
};
const IMPORTANCE_LABEL: Record<string, string> = {
  none:   "",
  low:    "Низкая",
  medium: "Средняя",
  high:   "Высокая",
};

const RECURRENCE_LABEL: Record<string, string> = {
  none:     "",
  daily:    "Каждый день",
  weekdays: "По будням",
  weekly:   "Раз в неделю",
  monthly:  "Раз в месяц",
};

// ── Task Card ────────────────────────────────────────────────
function TaskCard({
  task,
  index,
  onComplete,
}: {
  task: any;
  index: number;
  onComplete: (id: string) => void;
}) {
  const xpInfo = TASK_XP[task.taskType as TaskType] ?? TASK_XP.routine;
  const isHardBlock = task.taskType === "hard_block";
  const typeMeta = TYPE_BADGE[task.taskType as TaskType] ?? TYPE_BADGE.routine;
  const { getCategoryLabel, getCategoryIcon } = useCategoriesContext();
  const catIcon = getCategoryIcon(task.category);
  const catLabel = getCategoryLabel(task.category);
  const importance = task.importance as string | undefined;
  const recurrence = task.recurrence as string | undefined;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ ...springConfig, delay: index * 0.05 }}
      whileHover={{ scale: 1.01, backgroundColor: "rgba(42, 42, 42, 0.6)" }}
      className={`
        relative flex items-center gap-4 p-4 rounded-xl
        bg-surface-2 border border-gunmetal/50
        transition-colors cursor-pointer
        ${isHardBlock ? "hard-block-border" : ""}
      `}
      id={`task-${task.id}`}
    >
      {/* Checkbox */}
      <motion.button
        onClick={() => onComplete(task.id)}
        whileTap={{ scale: 0.8 }}
        transition={springConfig}
        className={`
          flex-shrink-0 w-5 h-5 rounded-md border-2 
          ${isHardBlock ? "border-copper" : "border-gunmetal-light"}
          hover:border-copper transition-colors focus:outline-none
        `}
        aria-label={`Отметить "${task.title}" как выполненную`}
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-text-primary truncate font-sans">
          {task.title}
        </p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {/* Category chip */}
          <span className="inline-flex items-center gap-1 text-[10px] text-text-muted">
            <span className="text-xs">{catIcon}</span>
            <span className="uppercase tracking-wider">{catLabel}</span>
          </span>

          {/* Type badge */}
          <span
            className={`
              inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-md
              ${isHardBlock
                ? "bg-copper/10 text-copper"
                : task.taskType === "strategic"
                  ? "bg-copper/5 text-copper-light"
                  : "bg-surface-3 text-text-muted"
              }
            `}
          >
            <span className="text-[9px]">{typeMeta.icon}</span>
            {typeMeta.label}
          </span>

          {/* Importance badge */}
          {importance && importance !== "none" && IMPORTANCE_LABEL[importance] && (
            <span className="inline-flex items-center gap-1 text-[10px] font-sans text-text-muted">
              <span className={`w-1.5 h-1.5 rounded-full ${IMPORTANCE_DOT[importance]}`} />
              {IMPORTANCE_LABEL[importance]}
            </span>
          )}

          {/* Recurrence badge */}
          {recurrence && recurrence !== "none" && RECURRENCE_LABEL[recurrence] && (
            <span className="inline-flex items-center gap-1 text-[10px] font-mono text-text-muted">
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M1 4v6h6M23 20v-6h-6"/>
                <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15"/>
              </svg>
              {RECURRENCE_LABEL[recurrence]}
            </span>
          )}

          {/* Streak */}
          {task.streakCount > 0 && (
            <span className="text-[10px] font-mono text-copper">
              🔥 {task.streakCount}
            </span>
          )}
        </div>
      </div>

      {/* XP Badge */}
      <div
        className={`
          flex-shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium
          ${isHardBlock
            ? "bg-copper/15 text-copper"
            : task.taskType === "strategic"
              ? "bg-copper/10 text-copper-light"
              : "bg-surface-3 text-text-secondary"
          }
        `}
      >
        +{xpInfo.reward} XP
      </div>
    </motion.div>
  );
}


// ── Section Header ───────────────────────────────────────────
function SectionHeader({
  title,
  count,
  icon,
}: {
  title: string;
  count: number;
  icon?: string;
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h3 className="font-serif text-base text-text-primary">
        {icon && <span className="mr-1.5">{icon}</span>}
        {title}
      </h3>
      <span className="font-mono text-xs text-text-muted">{count}</span>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────
export default function TaskList() {
  const { session } = useAuth();
  const { tasks, isLoading, revalidate } = useTasks(session?.access_token);

  const handleComplete = useCallback(
    async (id: string) => {
      if (!session?.access_token) return;

      // Оптимистичное обновление — убрать задачу мгновенно
      revalidate(tasks.filter((t) => t.id !== id), false);

      try {
        await tasksApi.update(session.access_token, id, { status: "completed" });
        // Инвалидируем и задачи, и аналитику (XP изменился)
        invalidateAll(session.access_token);
      } catch (e) {
        console.error("Complete task failed", e);
        revalidate(); // откат
      }
    },
    [session, tasks, revalidate]
  );

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-16 rounded-xl" />
        ))}
      </div>
    );
  }

  const hardBlocks = tasks.filter((t) => t.taskType === "hard_block");
  const strategic = tasks.filter((t) => t.taskType === "strategic");
  const routine = tasks.filter((t) => t.taskType === "routine");

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-3xl mb-3">📋</p>
        <p className="text-sm text-text-muted font-sans">
          Нет активных задач
        </p>
        <p className="text-xs text-text-muted/60 font-sans mt-1">
          Нажмите <span className="text-copper">+</span> для создания
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hard Blocks */}
      {hardBlocks.length > 0 && (
        <section>
          <SectionHeader
            title="Непереносимые"
            count={hardBlocks.length}
            icon="🔒"
          />
          <div className="space-y-2">
            <AnimatePresence>
              {hardBlocks.map((task, i) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  index={i}
                  onComplete={handleComplete}
                />
              ))}
            </AnimatePresence>
          </div>
        </section>
      )}

      {/* Strategic */}
      {strategic.length > 0 && (
        <section>
          <SectionHeader
            title="Стратегические"
            count={strategic.length}
            icon="🎯"
          />
          <div className="space-y-2">
            <AnimatePresence>
              {strategic.map((task, i) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  index={i}
                  onComplete={handleComplete}
                />
              ))}
            </AnimatePresence>
          </div>
        </section>
      )}

      {/* Routine */}
      {routine.length > 0 && (
        <section>
          <SectionHeader
            title="Рутина"
            count={routine.length}
            icon="🔄"
          />
          <div className="space-y-2">
            <AnimatePresence>
              {routine.map((task, i) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  index={i}
                  onComplete={handleComplete}
                />
              ))}
            </AnimatePresence>
          </div>
        </section>
      )}
    </div>
  );
}
