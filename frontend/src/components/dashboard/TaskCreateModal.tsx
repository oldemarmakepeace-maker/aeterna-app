"use client";

/**
 * AETERNA — Task Create Modal.
 * Премиальная форма создания задач в стиле Quiet Luxury.
 * Поля: название, категория, тип (XP), важность, повторение, дедлайн, описание.
 */

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TASK_XP,
  type TaskType,
  type LifeCategory,
} from "@/lib/constants";
import { useCategoriesContext } from "@/lib/CategoryContext";
import { useAuth } from "@/lib/AuthContext";
import { tasksApi } from "@/lib/api";
import { invalidateAll } from "@/lib/hooks";

const springConfig = { type: "spring" as const, stiffness: 400, damping: 25 };
const overlaySpring = { type: "spring" as const, stiffness: 300, damping: 30 };

// ── Recurrence ────────────────────────────────────────────────
type Recurrence = "none" | "daily" | "weekdays" | "weekly" | "monthly";

const RECURRENCE_OPTIONS: { value: Recurrence; label: string; icon: string }[] = [
  { value: "none",     label: "Не повторять", icon: "✕" },
  { value: "daily",    label: "Каждый день",  icon: "∞" },
  { value: "weekdays", label: "По будням",    icon: "📅" },
  { value: "weekly",   label: "Раз в неделю", icon: "🗓" },
  { value: "monthly",  label: "Раз в месяц",  icon: "🌙" },
];

// ── Importance ────────────────────────────────────────────────
type Importance = "none" | "low" | "medium" | "high";

const IMPORTANCE_OPTIONS: {
  value: Importance;
  label: string;
  desc: string;
  color: string;
  dot: string;
}[] = [
  {
    value: "none",
    label: "Без приоритета",
    desc: "Нейтральная задача",
    color: "border-gunmetal/50 hover:border-gunmetal-light",
    dot: "bg-text-muted",
  },
  {
    value: "low",
    label: "Низкая",
    desc: "Можно сделать позже",
    color: "border-gunmetal-light/50 hover:border-gunmetal-light",
    dot: "bg-text-secondary",
  },
  {
    value: "medium",
    label: "Средняя",
    desc: "Желательно выполнить",
    color: "border-copper-dark/40 hover:border-copper/50",
    dot: "bg-copper-dark",
  },
  {
    value: "high",
    label: "Высокая",
    desc: "Приоритет без штрафов",
    color: "border-copper/50 hover:border-copper-light/70",
    dot: "bg-copper",
  },
];

// ── Task types ────────────────────────────────────────────────
const TASK_TYPE_META: Record<
  TaskType,
  { icon: string; label: string; desc: string; accent: string }
> = {
  routine: {
    icon: "🔄",
    label: "Рутина",
    desc: "Ежедневная привычка. Можно свободно переносить.",
    accent: "border-text-muted/30 hover:border-text-secondary/50",
  },
  strategic: {
    icon: "🎯",
    label: "Стратегическая",
    desc: "Важная задача с дедлайном. Перенос нежелателен.",
    accent: "border-copper-dark/40 hover:border-copper/60",
  },
  hard_block: {
    icon: "🔒",
    label: "Непереносимая",
    desc: "Критическое событие. Максимальный штраф за срыв.",
    accent: "border-copper/50 hover:border-copper-light/70",
  },
};

const CATEGORIES: LifeCategory[] = [
  "work", "health", "relationships", "recreation", "finance", "growth",
];

interface TaskCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTitle?: string;
}

export default function TaskCreateModal({
  isOpen,
  onClose,
  initialTitle = "",
}: TaskCreateModalProps) {
  const [title, setTitle] = useState(initialTitle);
  const [category, setCategory] = useState("");
  const [taskType, setTaskType] = useState<TaskType>("strategic");
  const [importance, setImportance] = useState<Importance>("none");
  const [recurrence, setRecurrence] = useState<Recurrence>("none");
  const [dueDate, setDueDate] = useState("");
  const [description, setDescription] = useState("");
  const [showDescription, setShowDescription] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const titleRef = useRef<HTMLInputElement>(null);
  const { session } = useAuth();
  
  const { categories } = useCategoriesContext();

  // Default category to first available
  useEffect(() => {
    if (categories.length > 0 && !category) {
      setCategory(categories[0].slug);
    }
  }, [categories, category]);

  useEffect(() => {
    if (isOpen) {
      setTitle(initialTitle);
      setError("");
      setTimeout(() => titleRef.current?.focus(), 100);
    }
  }, [isOpen, initialTitle]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  const handleReset = () => {
    setTitle("");
    setCategory(categories[0]?.slug ?? "");
    setTaskType("strategic");
    setImportance("none");
    setRecurrence("none");
    setDueDate("");
    setDescription("");
    setShowDescription(false);
    setError("");
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleSubmit = async () => {
    const trimmed = title.trim();
    if (!trimmed) {
      setError("Введите название задачи");
      titleRef.current?.focus();
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const payload: Record<string, unknown> = {
        title: trimmed,
        task_type: taskType,
        category,
        recurrence,
        importance,
      };
      if (description.trim()) payload.description = description.trim();
      if (dueDate) payload.due_date = new Date(dueDate).toISOString();

      await tasksApi.create(session!.access_token, payload);

      handleClose();
      // Инвалидируем кэш задач и аналитики через SWR
      invalidateAll(session!.access_token);
    } catch (err: any) {
      console.error("Create task failed", err);
      setError(err?.message || "Ошибка сервера. Попробуйте снова.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const xpInfo = TASK_XP[taskType];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-end justify-center md:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Sheet */}
          <motion.div
            className="relative w-full max-w-md mx-auto bg-surface-1 border border-gunmetal rounded-t-3xl md:rounded-3xl overflow-hidden max-h-[92dvh] md:max-h-[85vh] overflow-y-auto shadow-2xl shadow-black/50"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={overlaySpring}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 md:hidden">
              <div className="w-10 h-1 rounded-full bg-gunmetal-light" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 pb-4 pt-2">
              <h2 className="font-serif text-xl text-text-primary">Новая задача</h2>
              <motion.button
                whileTap={{ scale: 0.85 }}
                transition={springConfig}
                onClick={handleClose}
                className="w-8 h-8 rounded-full bg-surface-2 border border-gunmetal/50 flex items-center justify-center text-text-muted hover:text-text-secondary transition-colors"
                id="modal-close-btn"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </motion.button>
            </div>

            <div className="px-6 pb-8 space-y-6">

              {/* ── Title ─────────────────────────────────────── */}
              <div>
                <label className="block text-xs text-text-muted uppercase tracking-wider mb-2 font-sans">
                  Название
                </label>
                <input
                  ref={titleRef}
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Что нужно сделать?"
                  className="w-full bg-surface-2 border border-gunmetal rounded-xl px-4 py-3 text-sm text-text-primary placeholder-text-muted font-sans outline-none input-focus"
                  id="task-title-input"
                  onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }}
                />
              </div>

              {/* ── Category ──────────────────────────────────── */}
              <div>
                <label className="block text-xs text-text-muted uppercase tracking-wider mb-2 font-sans">
                  Категория
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {categories.map((cat) => {
                    const isActive = category === cat.slug;
                    return (
                      <motion.button
                        key={cat.slug}
                        type="button"
                        whileTap={{ scale: 0.93 }}
                        transition={springConfig}
                        onClick={() => setCategory(cat.slug)}
                        className={`
                          flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-sans
                          border transition-all duration-200
                          ${isActive
                            ? "bg-copper/10 border-copper/40 text-copper"
                            : "bg-surface-2 border-gunmetal/50 text-text-secondary hover:border-gunmetal-light"
                          }
                        `}
                        id={`cat-${cat.slug}`}
                      >
                        <span className="text-base">{cat.icon}</span>
                        <span className="truncate">{cat.label}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* ── Task Type ─────────────────────────────────── */}
              <div>
                <label className="block text-xs text-text-muted uppercase tracking-wider mb-2 font-sans">
                  Можно ли перенести?
                </label>
                <div className="space-y-2">
                  {(Object.keys(TASK_TYPE_META) as TaskType[]).map((type) => {
                    const meta = TASK_TYPE_META[type];
                    const isActive = taskType === type;
                    const xp = TASK_XP[type];
                    return (
                      <motion.button
                        key={type}
                        type="button"
                        whileTap={{ scale: 0.97 }}
                        transition={springConfig}
                        onClick={() => setTaskType(type)}
                        className={`
                          w-full flex items-start gap-3 p-3.5 rounded-xl text-left
                          border-2 transition-all duration-200
                          ${isActive
                            ? type === "hard_block"
                              ? "bg-copper/10 border-copper text-text-primary copper-glow-sm"
                              : type === "strategic"
                              ? "bg-copper/5 border-copper-dark text-text-primary"
                              : "bg-surface-3/50 border-text-secondary/30 text-text-primary"
                            : `bg-surface-2 ${meta.accent} text-text-secondary`
                          }
                        `}
                        id={`type-${type}`}
                      >
                        <span className="text-lg mt-0.5 flex-shrink-0">{meta.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-sans font-medium">{meta.label}</span>
                            <span className={`text-[10px] font-mono ${isActive ? "text-copper" : "text-text-muted"}`}>
                              +{xp.reward} XP
                              {xp.penalty !== 0 && (
                                <span className="text-red-400/70 ml-1">{xp.penalty} XP</span>
                              )}
                            </span>
                          </div>
                          <p className="text-[11px] text-text-muted mt-0.5 leading-relaxed">
                            {meta.desc}
                          </p>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* ── Importance ────────────────────────────────── */}
              <div>
                <label className="block text-xs text-text-muted uppercase tracking-wider mb-1 font-sans">
                  Важность
                </label>
                <p className="text-[10px] text-text-muted font-sans mb-2">
                  Организационный лейбл · Не влияет на XP
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {IMPORTANCE_OPTIONS.map((opt) => {
                    const isActive = importance === opt.value;
                    return (
                      <motion.button
                        key={opt.value}
                        type="button"
                        whileTap={{ scale: 0.93 }}
                        transition={springConfig}
                        onClick={() => setImportance(opt.value)}
                        className={`
                          flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left
                          border transition-all duration-200
                          ${isActive
                            ? "bg-surface-3 border-copper/40 text-text-primary"
                            : `bg-surface-2 ${opt.color} text-text-secondary`
                          }
                        `}
                        id={`importance-${opt.value}`}
                      >
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${opt.dot}`} />
                        <div className="min-w-0">
                          <p className="text-[12px] font-sans font-medium">{opt.label}</p>
                          <p className="text-[10px] text-text-muted truncate">{opt.desc}</p>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* ── Recurrence ────────────────────────────────── */}
              <div>
                <label className="block text-xs text-text-muted uppercase tracking-wider mb-2 font-sans">
                  Повторение
                </label>
                <div className="flex flex-wrap gap-2">
                  {RECURRENCE_OPTIONS.map((opt) => {
                    const isActive = recurrence === opt.value;
                    return (
                      <motion.button
                        key={opt.value}
                        type="button"
                        whileTap={{ scale: 0.9 }}
                        transition={springConfig}
                        onClick={() => setRecurrence(opt.value)}
                        className={`
                          flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-sans
                          border transition-all duration-200
                          ${isActive
                            ? "bg-copper/10 border-copper/50 text-copper"
                            : "bg-surface-2 border-gunmetal/50 text-text-secondary hover:border-gunmetal-light"
                          }
                        `}
                        id={`rec-${opt.value}`}
                      >
                        <span className="text-[11px]">{opt.icon}</span>
                        {opt.label}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* ── Due Date ──────────────────────────────────── */}
              <div>
                <label className="block text-xs text-text-muted uppercase tracking-wider mb-2 font-sans">
                  Дедлайн <span className="text-text-muted/50">(опционально)</span>
                </label>
                <input
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-surface-2 border border-gunmetal rounded-xl px-4 py-3 text-sm text-text-primary font-sans outline-none input-focus [color-scheme:dark]"
                  id="task-due-date"
                />
              </div>

              {/* ── Description (expandable) ──────────────────── */}
              <div>
                {!showDescription ? (
                  <motion.button
                    type="button"
                    onClick={() => setShowDescription(true)}
                    whileTap={{ scale: 0.97 }}
                    transition={springConfig}
                    className="flex items-center gap-2 text-xs text-text-muted hover:text-text-secondary transition-colors font-sans"
                    id="add-description-btn"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    Добавить описание
                  </motion.button>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    transition={springConfig}
                  >
                    <label className="block text-xs text-text-muted uppercase tracking-wider mb-2 font-sans">
                      Описание
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Подробности задачи..."
                      rows={3}
                      className="w-full bg-surface-2 border border-gunmetal rounded-xl px-4 py-3 text-sm text-text-primary placeholder-text-muted font-sans outline-none input-focus resize-none"
                      id="task-description"
                    />
                  </motion.div>
                )}
              </div>

              {/* ── Error ─────────────────────────────────────── */}
              <AnimatePresence>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="text-xs text-red-400/80 font-sans"
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>

              {/* ── Summary before submit ─────────────────────── */}
              {(recurrence !== "none" || importance !== "none") && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={springConfig}
                  className="flex flex-wrap gap-2"
                >
                  {recurrence !== "none" && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono bg-surface-2 border border-gunmetal/50 text-text-muted">
                      {RECURRENCE_OPTIONS.find(r => r.value === recurrence)?.icon}{" "}
                      {RECURRENCE_OPTIONS.find(r => r.value === recurrence)?.label}
                    </span>
                  )}
                  {importance !== "none" && (
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono border ${
                      importance === "high"
                        ? "bg-copper/10 border-copper/30 text-copper-light"
                        : importance === "medium"
                        ? "bg-copper-dark/10 border-copper-dark/30 text-copper-dark"
                        : "bg-surface-2 border-gunmetal/50 text-text-muted"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${IMPORTANCE_OPTIONS.find(i => i.value === importance)?.dot}`} />
                      {IMPORTANCE_OPTIONS.find(i => i.value === importance)?.label}
                    </span>
                  )}
                </motion.div>
              )}

              {/* ── Buttons ─────────────────────────────────────── */}
              <div className="flex gap-3 pt-2">
                <motion.button
                  type="button"
                  onClick={handleClose}
                  whileTap={{ scale: 0.95 }}
                  transition={springConfig}
                  className="flex-1 py-3.5 rounded-xl bg-surface-2 border border-gunmetal text-text-secondary text-sm font-sans hover:bg-surface-3 transition-colors"
                  id="task-cancel-btn"
                >
                  Отмена
                </motion.button>
                <motion.button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  whileTap={{ scale: 0.95 }}
                  transition={springConfig}
                  className={`
                    flex-1 py-3.5 rounded-xl text-sm font-sans font-medium transition-all duration-200
                    ${isSubmitting
                      ? "bg-copper/20 text-copper/50 cursor-not-allowed"
                      : "bg-copper text-surface-1 hover:bg-copper-light copper-glow-sm"
                    }
                  `}
                  id="task-submit-btn"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-copper/30 border-t-copper rounded-full animate-spin" />
                      Создаю...
                    </span>
                  ) : (
                    "Создать задачу"
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
