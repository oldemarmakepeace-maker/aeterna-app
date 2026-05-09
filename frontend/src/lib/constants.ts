/**
 * AETERNA — Constants & Types.
 * Типы задач, категории, ранги, цвета для радара.
 */

// ── Life Categories (6 осей радара) ──────────────────────────
export type LifeCategory =
  | "work"
  | "health"
  | "relationships"
  | "recreation"
  | "finance"
  | "growth";

export const CATEGORY_LABELS: Record<LifeCategory, string> = {
  work: "Работа",
  health: "Здоровье",
  relationships: "Отношения",
  recreation: "Отдых",
  finance: "Финансы",
  growth: "Рост",
};

export const CATEGORY_ICONS: Record<LifeCategory, string> = {
  work: "💼",
  health: "🏋️",
  relationships: "🤝",
  recreation: "🌿",
  finance: "📊",
  growth: "🚀",
};

// ── Task Types ───────────────────────────────────────────────
export type TaskType = "routine" | "strategic" | "hard_block";
export type TaskStatus = "pending" | "completed" | "failed" | "skipped";

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  routine: "Рутина",
  strategic: "Стратегическая",
  hard_block: "Hard Block",
};

export const TASK_XP: Record<TaskType, { reward: number; penalty: number }> = {
  routine: { reward: 5, penalty: 0 },
  strategic: { reward: 20, penalty: -15 },
  hard_block: { reward: 50, penalty: -100 },
};

// ── business Ranks ───────────────────────────────────────────
export interface RankInfo {
  name: string;
  threshold: number;
  next: number | null;
}

export const RANKS: RankInfo[] = [
  { name: "Операционный", threshold: 0, next: 500 },
  { name: "Тактический", threshold: 500, next: 2000 },
  { name: "Стратегический", threshold: 2000, next: 5000 },
  { name: "Элита", threshold: 5000, next: null },
];

export function getRankByXp(xp: number): RankInfo {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (xp >= RANKS[i].threshold) return RANKS[i];
  }
  return RANKS[0];
}

// ── Data Interfaces ──────────────────────────────────────────
export interface CategoryAxis {
  category: LifeCategory;
  value: number;
  label: string;
}

export interface ProductivityIndex {
  axes: CategoryAxis[];
  totalXp: number;
  rank: string;
  streakMultiplier: number;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  taskType: TaskType;
  category: LifeCategory;
  status: TaskStatus;
  dueDate?: string;
  streakCount: number;
  createdAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  isHardBlock: boolean;
  category: LifeCategory;
  status: string;
}
