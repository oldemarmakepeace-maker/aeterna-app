"use client";

/**
 * AETERNA — Полноценная страница Календаря в стиле Apple Calendar.
 * Адаптировано под Desktop (Сетка: слева календарь, справа задачи).
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import TaskCreateModal from "@/components/dashboard/TaskCreateModal";
import { useCategoriesContext } from "@/lib/CategoryContext";
import { useAuth } from "@/lib/AuthContext";

const spring = { type: "spring" as const, stiffness: 400, damping: 25 };
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// ── Types ─────────────────────────────────────────────────────
interface DayItem {
  id: string;
  title: string;
  type: "task" | "event";
  taskType?: string;
  category?: string;
  status: string;
  dueDate?: string;
  createdAt?: string;
  startsAt?: string;
  endsAt?: string;
  isHardBlock?: boolean;
}

// ── Constants ────────────────────────────────────────────────
const MONTHS_RU = [
  "Январь","Февраль","Март","Апрель","Май","Июнь",
  "Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь",
];
const DAYS_SHORT = ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];

// ── Date Helpers ──────────────────────────────────────────────
function toLocalISO(d: Date): string {
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${mo}-${day}`;
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function stripTime(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function parseDate(iso: string | undefined): Date | null {
  if (!iso) return null;
  try {
    if (/^\d{4}-\d{2}-\d{2}$/.test(iso.trim())) {
      const [y, m, d] = iso.trim().split("-").map(Number);
      return new Date(y, m - 1, d);
    }
    return new Date(iso);
  } catch {
    return null;
  }
}

function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = [];
  const d = new Date(year, month, 1);
  while (d.getMonth() === month) {
    days.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return days;
}

function dowMon(d: Date): number {
  return (d.getDay() + 6) % 7;
}

function formatDeadline(iso: string): string {
  const d = parseDate(iso);
  if (!d) return iso;
  return d.toLocaleDateString("ru", { day: "numeric", month: "short", year: "numeric" });
}

function isOverdue(iso: string | undefined): boolean {
  if (!iso) return false;
  const d = parseDate(iso);
  if (!d) return false;
  return stripTime(d) < stripTime(new Date());
}

// ── Dot color for a day ───────────────────────────────────────
function dotClass(dayItems: DayItem[]): string | null {
  if (!dayItems.length) return null;
  if (dayItems.some(i => i.taskType === "hard_block" || i.isHardBlock)) return "bg-copper";
  if (dayItems.some(i => i.taskType === "strategic")) return "bg-copper-dark";
  return "bg-text-muted";
}


// ── Task Card ─────────────────────────────────────────────────
function TaskCard({
  item,
  onComplete,
}: {
  item: DayItem;
  onComplete: (id: string) => void;
}) {
  const done = item.status === "completed";
  const isHard = item.taskType === "hard_block" || item.isHardBlock;
  const overdue = !done && isOverdue(item.dueDate);
  const { getCategoryLabel, getCategoryIcon } = useCategoriesContext();
  const catIcon = item.category ? getCategoryIcon(item.category) : "📋";
  const catLabel = item.category ? getCategoryLabel(item.category) : "";

  const timeStr = (() => {
    const d = parseDate(item.startsAt);
    if (!d) return null;
    return d.toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" });
  })();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: done ? 0.48 : 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      transition={spring}
      className="relative flex items-start gap-3 px-4 py-3.5 border-b border-gunmetal/30 last:border-0"
    >
      {/* Accent stripe */}
      <div className={`absolute left-0 inset-y-2 w-[3px] rounded-r-full ${
        isHard ? "bg-copper" :
        item.taskType === "strategic" ? "bg-copper-dark" :
        "bg-gunmetal-light"
      }`} />

      {/* Checkbox (tasks only) */}
      {item.type === "task" && (
        <motion.button
          whileTap={{ scale: 0.72 }}
          transition={spring}
          onClick={() => !done && onComplete(item.id)}
          className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
            done
              ? "bg-copper border-copper"
              : isHard
              ? "border-copper hover:bg-copper/20"
              : "border-gunmetal-light hover:border-copper-dark"
          }`}
          id={`check-${item.id}`}
          aria-label="Выполнить задачу"
        >
          {done && (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round">
              <path d="M5 12l5 5L19 7" />
            </svg>
          )}
        </motion.button>
      )}

      {/* Event dot */}
      {item.type === "event" && (
        <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${isHard ? "bg-copper" : "bg-text-muted"}`} />
      )}

      {/* Body */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-sans ${done ? "line-through text-text-muted" : "text-text-primary"}`}>
          {isHard && <span className="text-copper mr-1">🔒</span>}
          {item.title}
        </p>

        {/* Category / time row */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1">
          {item.category && (
            <span className="text-[10px] text-text-muted font-sans flex items-center gap-1">
              <span>{catIcon}</span>
              {catLabel}
            </span>
          )}

          {item.type === "task" && item.dueDate && (
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
              overdue
                ? "bg-red-500/10 text-red-400 border border-red-500/20"
                : "bg-surface-3 text-text-muted"
            }`}>
              {overdue ? "Просрочено: " : "Дедлайн: "}
              {formatDeadline(item.dueDate)}
            </span>
          )}

          {item.type === "event" && timeStr && (
            <span className="text-[10px] font-mono bg-surface-3 text-text-secondary px-1.5 py-0.5 rounded">
              {timeStr}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function CalendarPage() {
  const [today] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(today);
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());

  const [items, setItems] = useState<DayItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { session } = useAuth();

  const fetchAll = useCallback(async () => {
    if (!session?.access_token) { setLoading(false); return; }
    try {
      const [tasksRes, eventsRes] = await Promise.all([
        fetch(`${API_URL}/api/v1/tasks`, { headers: { Authorization: `Bearer ${session.access_token}` } }),
        fetch(`${API_URL}/api/v1/events`, { headers: { Authorization: `Bearer ${session.access_token}` } })
      ]);

      const tasks = tasksRes.ok ? await tasksRes.json() : [];
      const events = eventsRes.ok ? await eventsRes.json() : [];

      const combined: DayItem[] = [
        ...tasks.map((t: any) => ({
          ...t, type: "task", dueDate: t.due_date, createdAt: t.created_at,
        })),
        ...events.map((e: any) => ({
          ...e, type: "event", title: e.title, startsAt: e.starts_at, endsAt: e.ends_at, isHardBlock: e.is_hard_block, status: "pending",
        }))
      ];
      setItems(combined);
    } catch (e) {
      console.error("Calendar fetch error:", e);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    fetchAll();
    window.addEventListener("task-completed", fetchAll);
    window.addEventListener("task-created", fetchAll);
    return () => {
      window.removeEventListener("task-completed", fetchAll);
      window.removeEventListener("task-created", fetchAll);
    };
  }, [fetchAll]);

  const handleComplete = async (id: string) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, status: "completed" } : i));
    try {
      await fetch(`${API_URL}/api/v1/tasks/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ status: "completed" }),
      });
      window.dispatchEvent(new Event("task-completed"));
    } catch {
      fetchAll();
    }
  };

  const daysInMonth = useMemo(() => getDaysInMonth(viewYear, viewMonth), [viewYear, viewMonth]);
  const firstOffset = daysInMonth.length > 0 ? dowMon(daysInMonth[0]) : 0;

  const itemsForDate = useCallback((date: Date): DayItem[] => {
    return items.filter(item => {
      // Exact due date match
      const due = parseDate(item.dueDate || item.endsAt);
      if (due && sameDay(due, date)) return true;
      // No-date tasks → show under today
      if (!item.dueDate && !item.endsAt && sameDay(date, today)) return true;
      return false;
    });
  }, [items, today]);

  const selectedItems = useMemo(() => itemsForDate(selectedDate), [itemsForDate, selectedDate]);

  const total = selectedItems.length;
  const doneCount = selectedItems.filter(i => i.status === "completed").length;
  const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  const selectedDayLabel = selectedDate.toLocaleDateString("ru", {
    weekday: "long", day: "numeric", month: "long",
  });

  const prevMonth = () => {
    const nm = viewMonth === 0 ? 11 : viewMonth - 1;
    const ny = viewMonth === 0 ? viewYear - 1 : viewYear;
    setViewMonth(nm);
    setViewYear(ny);
    setSelectedDate(new Date(ny, nm, 1));
  };

  const nextMonth = () => {
    const nm = viewMonth === 11 ? 0 : viewMonth + 1;
    const ny = viewMonth === 11 ? viewYear + 1 : viewYear;
    setViewMonth(nm);
    setViewYear(ny);
    setSelectedDate(new Date(ny, nm, 1));
  };

  const goToToday = () => {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setSelectedDate(today);
  };

  return (
    <>
      {/* ── Main Layout (Max-width for mobile, Grid for Desktop) ── */}
      <div className="relative w-full max-w-md lg:max-w-6xl mx-auto lg:px-8 pb-28 lg:pb-12 min-h-dvh pt-2 lg:pt-8 bg-surface-1">
        
        <div className="lg:hidden">
            <Header />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 lg:gap-10">
          
          {/* ── Левая колонка (Календарь) ────────────────────── */}
          <div className="col-span-1 lg:col-span-6 bg-surface-2/30 lg:bg-surface-2/50 lg:p-6 lg:rounded-3xl lg:border lg:border-gunmetal/30 lg:shadow-xl lg:shadow-black/20">
            {/* ── Month nav ─────────────────────────────────────── */}
            <div className="flex items-center justify-between px-4 lg:px-2 mb-4 mt-2 lg:mt-0">
              <div className="flex bg-surface-2 lg:bg-surface-3 lg:border lg:border-gunmetal/40 rounded-xl p-1 shadow-sm">
                <motion.button
                  whileTap={{ scale: 0.82 }}
                  transition={spring}
                  onClick={prevMonth}
                  className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-3 lg:hover:bg-gunmetal-light transition-colors"
                  id="prev-month"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </motion.button>
              </div>

              <button
                onClick={goToToday}
                className="flex-1 text-center text-[15px] font-serif text-text-primary"
                id="month-label"
              >
                {MONTHS_RU[viewMonth]} {viewYear}
              </button>

              <div className="flex gap-2 text-right">
                  <div className="flex bg-surface-2 lg:bg-surface-3 lg:border lg:border-gunmetal/40 rounded-xl p-1 shadow-sm">
                    <motion.button
                        whileTap={{ scale: 0.82 }}
                        transition={spring}
                        onClick={nextMonth}
                        className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-3 lg:hover:bg-gunmetal-light transition-colors"
                        id="next-month"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M9 18l6-6-6-6" />
                        </svg>
                    </motion.button>
                  </div>
              </div>
            </div>

            {/* ── Day-of-week headers ───────────────────────────── */}
            <div className="grid grid-cols-7 px-4 lg:px-2 mb-2">
              {DAYS_SHORT.map(d => (
                <div key={d} className="text-center text-[11px] text-text-muted/80 font-sans uppercase tracking-widest py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* ── Day grid ─────────────────────────────────────── */}
            <div className="grid grid-cols-7 px-4 lg:px-2 gap-y-1 lg:gap-y-3 gap-x-1 lg:gap-x-2 mb-2 lg:mb-0">
              {Array.from({ length: firstOffset }).map((_, i) => <div key={`e${i}`} />)}

              {daysInMonth.map(date => {
                const isToday = sameDay(date, today);
                const isSelected = sameDay(date, selectedDate);
                const dot = dotClass(itemsForDate(date));

                return (
                  <div key={toLocalISO(date)} className="relative flex flex-col items-center justify-center lg:h-12 h-10">
                    <motion.button
                      whileTap={{ scale: 0.78 }}
                      transition={spring}
                      onClick={() => {
                        setSelectedDate(date);
                        setViewYear(date.getFullYear());
                        setViewMonth(date.getMonth());
                      }}
                      className={`
                        relative z-10 w-9 h-9 lg:w-11 lg:h-11 flex flex-col items-center justify-center
                        rounded-full text-[13px] lg:text-sm font-sans transition-colors select-none
                        ${isSelected
                          ? "bg-copper text-surface-1 font-semibold shadow-lg shadow-copper/20"
                          : isToday
                          ? "bg-copper/15 text-copper font-semibold"
                          : "text-text-primary hover:bg-surface-2 lg:hover:bg-surface-3"
                        }
                      `}
                      id={`day-${toLocalISO(date)}`}
                    >
                      {date.getDate()}
                      {dot && !isSelected && (
                        <span className={`absolute bottom-0.5 lg:bottom-1 w-1 lg:w-1.5 h-1 lg:h-1.5 rounded-full ${dot}`} />
                      )}
                    </motion.button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Правая колонка (Задачи дня) ────────────────────── */}
          <div className="col-span-1 lg:col-span-6 flex flex-col mt-4 lg:mt-0 border-t border-gunmetal/40 lg:border-t-0 pt-4 lg:pt-0">
            {/* ── Header ───────────────────────────── */}
            <div className="px-4 lg:px-0 mb-4 flex justify-between items-start">
              <div>
                <h2 className="font-serif text-lg lg:text-xl text-text-primary capitalize">
                  {selectedDayLabel}
                </h2>
                {total > 0 && (
                  <p className="text-[11px] text-text-muted font-mono mt-0.5">
                    {doneCount}/{total} выполнено · {pct}%
                  </p>
                )}
              </div>

              <div className="flex gap-4 items-center">
                  {total > 0 && (
                    <div className="w-10 h-10 lg:w-12 lg:h-12 relative flex-shrink-0">
                        <svg viewBox="0 0 36 36" className="rotate-[-90deg]" width="100%" height="100%">
                        <circle cx="18" cy="18" r="14" fill="none" stroke="#2A2A2A" strokeWidth="3" />
                        <circle
                            cx="18" cy="18" r="14" fill="none"
                            stroke="#B87333" strokeWidth="3"
                            strokeDasharray={`${pct * 0.879} 87.9`}
                            strokeLinecap="round"
                        />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-[9px] lg:text-[10px] font-mono text-copper">
                        {pct}%
                        </span>
                    </div>
                  )}

                  <motion.button
                    whileTap={{ scale: 0.82 }}
                    transition={spring}
                    onClick={() => setIsCreateOpen(true)}
                    className="p-2 lg:px-4 rounded-xl bg-copper hover:bg-copper-light text-surface-1 transition-colors flex items-center gap-2"
                    id="cal-add"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    <span className="hidden lg:block text-xs font-sans font-medium">Новая задача</span>
                  </motion.button>
              </div>
            </div>

            {/* ── Task list ────────────────────────────────────── */}
            {loading ? (
              <div className="px-4 lg:px-0 space-y-3">
                {[1, 2].map(i => (
                  <div key={i} className="h-16 rounded-2xl bg-surface-2 animate-pulse" />
                ))}
              </div>
            ) : selectedItems.length === 0 ? (
              <div className="text-center py-12 lg:py-20 lg:bg-surface-2/30 lg:border lg:border-gunmetal/30 lg:rounded-3xl mt-2">
                <p className="text-4xl mb-3 opacity-80">📅</p>
                <p className="text-sm text-text-muted font-sans font-medium tracking-wide">На этот день ничего не запланировано</p>
                <button
                  onClick={() => setIsCreateOpen(true)}
                  className="mt-4 px-4 py-2 rounded-lg text-xs text-copper font-sans border border-copper/30 hover:bg-copper/10 transition-colors"
                >
                  Создать задачу
                </button>
              </div>
            ) : (
              <div className="px-4 lg:px-0 space-y-4">
                {/* In-progress */}
                {selectedItems.filter(i => i.status !== "completed").length > 0 && (
                  <div className="bg-surface-2 border border-gunmetal/50 rounded-2xl overflow-hidden shadow-lg shadow-black/10">
                    <AnimatePresence>
                      {selectedItems
                        .filter(i => i.status !== "completed")
                        .sort((a, b) => {
                          const o: Record<string, number> = { hard_block: 0, strategic: 1, routine: 2 };
                          return (o[a.taskType ?? "routine"] ?? 2) - (o[b.taskType ?? "routine"] ?? 2);
                        })
                        .map(item => (
                          <TaskCard key={item.id} item={item} onComplete={handleComplete} />
                        ))}
                    </AnimatePresence>
                  </div>
                )}

                {/* Completed */}
                {selectedItems.filter(i => i.status === "completed").length > 0 && (
                  <div className="mt-6">
                    <p className="text-[10px] text-text-muted uppercase tracking-widest mb-2 font-sans px-1">
                      Выполнено
                    </p>
                    <div className="bg-surface-2/40 border border-gunmetal/30 rounded-2xl overflow-hidden">
                      <AnimatePresence>
                        {selectedItems
                          .filter(i => i.status === "completed")
                          .map(item => (
                            <TaskCard key={item.id} item={item} onComplete={handleComplete} />
                          ))}
                      </AnimatePresence>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
        </div>
      </div>

      <TaskCreateModal
        isOpen={isCreateOpen}
        onClose={() => { setIsCreateOpen(false); fetchAll(); }}
        initialTitle=""
      />

      <BottomNav />
    </>
  );
}
