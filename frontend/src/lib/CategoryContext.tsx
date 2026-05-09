"use client";

/**
 * AETERNA — Category Context.
 * Динамический список пользовательских категорий.
 * Провайдер оборачивает весь app/layout, компоненты используют useCategoriesContext().
 */

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useAuth } from "./AuthContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export interface Category {
  slug: string;
  label: string;
  icon: string;
}

// Default fallback (used while loading or on error)
export const DEFAULT_CATEGORIES: Category[] = [
  { slug: "work",          label: "Работа",    icon: "💼" },
  { slug: "health",        label: "Здоровье",  icon: "🏋️" },
  { slug: "relationships", label: "Отношения", icon: "🤝" },
  { slug: "recreation",    label: "Отдых",     icon: "🌿" },
  { slug: "finance",       label: "Финансы",   icon: "📊" },
  { slug: "growth",        label: "Рост",      icon: "🚀" },
];

interface CategoriesContextValue {
  categories: Category[];
  loading: boolean;
  refresh: () => Promise<void>;
  getCategoryLabel: (slug: string) => string;
  getCategoryIcon: (slug: string) => string;
  createCategory: (slug: string, label: string, icon: string) => Promise<void>;
  deleteCategory: (slug: string) => Promise<void>;
}

const CategoriesContext = createContext<CategoriesContextValue>({
  categories: DEFAULT_CATEGORIES,
  loading: false,
  refresh: async () => {},
  getCategoryLabel: (s) => s,
  getCategoryIcon: () => "📋",
  createCategory: async () => {},
  deleteCategory: async () => {},
});

export function CategoryProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const { session } = useAuth();

  const refresh = useCallback(async () => {
    if (!session?.access_token) { setLoading(false); return; }
    try {
      const res = await fetch(`${API_URL}/api/v1/categories`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const data: Category[] = await res.json();
        setCategories(data.length > 0 ? data : DEFAULT_CATEGORIES);
      }
    } catch (e) {
      console.warn("Categories fetch failed, using defaults:", e);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => { refresh(); }, [refresh]);

  const getCategoryLabel = useCallback((slug: string): string => {
    return categories.find(c => c.slug === slug)?.label ?? slug;
  }, [categories]);

  const getCategoryIcon = useCallback((slug: string): string => {
    return categories.find(c => c.slug === slug)?.icon ?? "📋";
  }, [categories]);

  const createCategory = useCallback(async (slug: string, label: string, icon: string) => {
    const res = await fetch(`${API_URL}/api/v1/categories`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session?.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ slug, label, icon }),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(body);
    }
    await refresh();
  }, [refresh]);

  const deleteCategory = useCallback(async (slug: string) => {
    const res = await fetch(`${API_URL}/api/v1/categories/${slug}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${session?.access_token}` },
    });
    if (!res.ok) throw new Error("Delete failed");
    await refresh();
  }, [refresh]);

  return (
    <CategoriesContext.Provider value={{
      categories, loading, refresh,
      getCategoryLabel, getCategoryIcon,
      createCategory, deleteCategory,
    }}>
      {children}
    </CategoriesContext.Provider>
  );
}

export function useCategoriesContext() {
  return useContext(CategoriesContext);
}
