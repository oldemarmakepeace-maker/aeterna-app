"use client";

/**
 * AETERNA — Productivity Radar.
 * 6-осевая радарная диаграмма баланса сфер жизни.
 * Использует useSWR для автоматической ревалидации данных.
 */

import { motion } from "framer-motion";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";
import { type CategoryAxis, getRankByXp } from "@/lib/constants";
import { useCategoriesContext, DEFAULT_CATEGORIES } from "@/lib/CategoryContext";
import { useAuth } from "@/lib/AuthContext";
import { useProductivityIndex } from "@/lib/hooks";

const springConfig = { type: "spring" as const, stiffness: 300, damping: 30 };

// Fallback axes (6 пустых осей при загрузке)
const FALLBACK_AXES: CategoryAxis[] = DEFAULT_CATEGORIES.map((c) => ({
  category: c.slug as any,
  value: 0,
  label: c.label,
}));

function CustomAngleTick(props: any) {
  const { x, y, payload } = props;
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      dominantBaseline="central"
      fill="#8A8580"
      fontSize={11}
      fontFamily="var(--font-inter)"
    >
      {payload.value}
    </text>
  );
}

export default function ProductivityRadar() {
  const { getCategoryLabel } = useCategoriesContext();
  const { session } = useAuth();
  const { axes, totalXp, rank, isLoading } = useProductivityIndex(
    session?.access_token
  );

  // Строим массив данных для Recharts
  const chartData: CategoryAxis[] =
    axes.length > 0
      ? axes.map((a) => ({
          category: a.category as any,
          value: Math.max(Math.floor(a.value), 1),
          label: getCategoryLabel(a.category),
        }))
      : FALLBACK_AXES;

  const rankInfo = getRankByXp(totalXp);
  const progressToNext = rankInfo.next
    ? ((totalXp - rankInfo.threshold) / (rankInfo.next - rankInfo.threshold)) *
      100
    : 100;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={springConfig}
      className="glass-card p-6"
    >
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-serif text-lg text-text-primary">
          Индекс Продуктивности
        </h2>
        <motion.span
          key={rank}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springConfig }}
          className="font-mono text-xs text-copper tracking-wide"
        >
          {rank.toUpperCase()}
        </motion.span>
      </div>

      <div className="w-full aspect-square max-w-[300px] mx-auto">
        {isLoading ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-6 h-6 rounded-full border-2 border-gunmetal border-t-copper animate-spin" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={chartData} cx="50%" cy="50%" outerRadius="75%">
              <PolarGrid
                gridType="polygon"
                stroke="#2C3539"
                strokeWidth={1}
              />
              <PolarAngleAxis
                dataKey="label"
                tick={CustomAngleTick}
                strokeWidth={0}
              />
              <Radar
                name="Баланс"
                dataKey="value"
                stroke="#B87333"
                strokeWidth={2}
                fill="rgba(184, 115, 51, 0.15)"
                fillOpacity={1}
                dot={{
                  r: 4,
                  fill: "#B87333",
                  stroke: "#0A0A0A",
                  strokeWidth: 2,
                }}
                animationDuration={1200}
                animationEasing="ease-out"
              />
            </RadarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between">
          <motion.span
            key={totalXp}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ ...springConfig }}
            className="font-mono text-2xl text-text-primary tracking-tight"
          >
            {totalXp.toLocaleString()}
            <span className="text-xs text-text-muted ml-1">XP</span>
          </motion.span>
          {rankInfo.next && (
            <span className="font-mono text-xs text-text-muted">
              → {rankInfo.next.toLocaleString()} XP
            </span>
          )}
        </div>

        <div className="relative h-1.5 bg-surface-3 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: "0%" }}
            animate={{ width: `${Math.min(Math.max(progressToNext, 0), 100)}%` }}
            transition={{ ...springConfig, delay: 0.3 }}
            className="absolute top-0 left-0 h-full rounded-full"
            style={{
              background: "linear-gradient(90deg, #8B5A2B, #B87333, #D4956B)",
            }}
          />
        </div>
      </div>
    </motion.div>
  );
}
