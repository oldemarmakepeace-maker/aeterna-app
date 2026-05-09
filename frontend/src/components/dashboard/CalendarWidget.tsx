"use client";

/**
 * AETERNA — Calendar Widget.
 * Горизонтальная лента 7 дней с точками-индикаторами событий.
 * Динамически загружает данные из API.
 */

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";

const springConfig = { type: "spring" as const, stiffness: 400, damping: 25 };

// API config mapped from .env.local
import { useAuth } from "@/lib/AuthContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// ── Helpers ──────────────────────────────────────────────────
const DAY_NAMES = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
const MONTH_NAMES = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря",
];

function getWeekDays(): Date[] {
  const today = new Date();
  const days: Date[] = [];
  // Генерируем 31 день: 3 дня назад и 27 дней вперед, чтобы заполнить широкий экран
  for (let i = -3; i <= 27; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d);
  }
  return days;
}

function isToday(date: Date): boolean {
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

function getIsoDateStr(date: Date): string {
  return date.toISOString().split("T")[0];
}

// ── Day Cell ─────────────────────────────────────────────────
function DayCell({
  date,
  isSelected,
  onSelect,
  events,
}: {
  date: Date;
  isSelected: boolean;
  onSelect: () => void;
  events: { total: number; hardBlocks: number };
}) {
  const today = isToday(date);

  return (
    <motion.button
      onClick={onSelect}
      whileTap={{ scale: 0.9 }}
      transition={springConfig}
      className={`
        relative flex flex-col items-center gap-1 py-3 px-3 rounded-2xl
        transition-colors min-w-[52px] md:min-w-[60px] flex-shrink-0
        ${isSelected
          ? "bg-copper/15 border border-copper/30"
          : "bg-transparent border border-transparent hover:bg-surface-3/50"
        }
      `}
    >
      {/* Day name */}
      <span
        className={`text-[10px] uppercase tracking-wider ${
          isSelected ? "text-copper" : "text-text-muted"
        }`}
      >
        {DAY_NAMES[date.getDay()]}
      </span>

      {/* Day number */}
      <span
        className={`text-lg font-mono font-medium ${
          isSelected
            ? "text-copper"
            : today
              ? "text-text-primary"
              : "text-text-secondary"
        }`}
      >
        {date.getDate()}
      </span>

      {/* Event dots */}
      <div className="flex gap-1 h-2">
        {events.hardBlocks > 0 && (
          <span className="w-1.5 h-1.5 rounded-full bg-copper" />
        )}
        {Array.from({ length: Math.min(events.total - events.hardBlocks, 3) }).map(
          (_, i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-text-muted/50"
            />
          )
        )}
      </div>
    </motion.button>
  );
}

// ── Main Component ───────────────────────────────────────────
export default function CalendarWidget() {
  const days = useMemo(getWeekDays, []);
  const [selectedIdx, setSelectedIdx] = useState(3); // Today is at index 3 (because i starts at -3)
  const [taskMap, setTaskMap] = useState<Record<string, { total: number; hardBlocks: number}>>({});
  const { session } = useAuth();

  const fetchTasks = async () => {
    if (!session?.access_token) return;
    try {
      const res = await fetch(`${API_URL}/api/v1/tasks`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const payload = await res.json();
        
        // Группируем задачи по дате создания или due_date
        const map: Record<string, { total: number; hardBlocks: number }> = {};
        
        for (const t of payload) {
          // Если есть due_date, привязываем день к нему, иначе к дате создания
          const dateRef = t.due_date ? new Date(t.due_date) : new Date(t.created_at);
          const dateStr = getIsoDateStr(dateRef);
          
          if (!map[dateStr]) map[dateStr] = { total: 0, hardBlocks: 0 };
          
          map[dateStr].total += 1;
          if (t.task_type === "hard_block") {
            map[dateStr].hardBlocks += 1;
          }
        }
        setTaskMap(map);
      }
    } catch (err) {
      console.error("Calendar fetch error:", err);
    }
  };

  useEffect(() => {
    fetchTasks();
    window.addEventListener("task-created", fetchTasks);
    return () => window.removeEventListener("task-created", fetchTasks);
  }, [session]);

  const selectedDate = days[selectedIdx];
  const formattedDate = `${selectedDate.getDate()} ${MONTH_NAMES[selectedDate.getMonth()]}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springConfig, delay: 0.1 }}
      className="glass-card p-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-serif text-base text-text-primary">Календарь</h2>
        <span className="text-xs text-text-muted font-sans">
          {formattedDate}
        </span>
      </div>

      {/* Day Strip */}
      <div className="flex gap-1 md:gap-2 overflow-x-auto pb-2 pt-1 scrollbar-none snap-x px-1">
        {days.map((date, idx) => {
          const ds = getIsoDateStr(date);
          const eq = taskMap[ds] || { total: 0, hardBlocks: 0 };
          return (
            <DayCell
              key={date.toISOString()}
              date={date}
              isSelected={idx === selectedIdx}
              onSelect={() => setSelectedIdx(idx)}
              events={eq}
            />
          );
        })}
      </div>
    </motion.div>
  );
}
