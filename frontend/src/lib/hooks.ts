/**
 * AETERNA — SWR Hooks.
 * Централизованные хуки для работы с API через SWR.
 * Автоматическая ревалидация, кэш и состояние загрузки из коробки.
 */

import useSWR, { mutate } from "swr";
import { tasksApi, analyticsApi } from "./api";

// ── SWR Keys ─────────────────────────────────────────────────

export const SWR_KEYS = {
  tasks: (token: string) => [`/api/v1/tasks`, token] as const,
  productivityIndex: (token: string) =>
    [`/api/v1/analytics/productivity-index`, token] as const,
  xpHistory: (token: string) => [`/api/v1/analytics/xp-history`, token] as const,
};

// ── Tasks Hook ────────────────────────────────────────────────

export interface Task {
  id: string;
  title: string;
  description?: string;
  taskType: "routine" | "strategic" | "hard_block";
  category: string;
  status: string;
  dueDate?: string;
  streakCount: number;
  createdAt: string;
  importance?: string;
  recurrence?: string;
}

function mapTaskRow(t: any): Task {
  return {
    id: t.id,
    title: t.title,
    description: t.description,
    taskType: t.task_type || "routine",
    category: t.category || "work",
    status: t.status,
    dueDate: t.due_date,
    streakCount: t.streak_count || 0,
    createdAt: t.created_at,
    importance: t.importance || "none",
    recurrence: t.recurrence || "none",
  };
}

export function useTasks(token: string | undefined, statusFilter = "pending") {
  const { data, error, isLoading, mutate: revalidate } = useSWR(
    token ? SWR_KEYS.tasks(token) : null,
    ([, tok]) => tasksApi.list(tok, { status: statusFilter }).then((rows) => rows.map(mapTaskRow)),
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }
  );

  return {
    tasks: data ?? [],
    isLoading,
    isError: !!error,
    revalidate,
  };
}

// ── Productivity Index Hook ───────────────────────────────────

export interface ProductivityAxis {
  category: string;
  value: number;
  label?: string;
}

export interface ProductivityIndex {
  axes: ProductivityAxis[];
  total_xp: number;
  rank: string;
}

export function useProductivityIndex(token: string | undefined) {
  const { data, error, isLoading, mutate: revalidate } = useSWR(
    token ? SWR_KEYS.productivityIndex(token) : null,
    ([, tok]) => analyticsApi.productivityIndex(tok) as Promise<ProductivityIndex>,
    {
      revalidateOnFocus: false,
      dedupingInterval: 10000,
    }
  );

  return {
    index: data,
    totalXp: data?.total_xp ?? 0,
    rank: data?.rank ?? "Операционный",
    axes: data?.axes ?? [],
    isLoading,
    isError: !!error,
    revalidate,
  };
}

// ── Global Mutators (вызываются после создания/завершения задачи) ──

export function invalidateTasks(token: string) {
  mutate(SWR_KEYS.tasks(token));
}

export function invalidateAnalytics(token: string) {
  mutate(SWR_KEYS.productivityIndex(token));
}

export function invalidateAll(token: string) {
  invalidateTasks(token);
  invalidateAnalytics(token);
}
