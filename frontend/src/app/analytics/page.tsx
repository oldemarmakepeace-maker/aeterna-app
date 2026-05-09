"use client";

import { motion } from "framer-motion";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import ProductivityRadar from "@/components/dashboard/ProductivityRadar";
import XpProgressBar from "@/components/dashboard/XpProgressBar";

const springConfig = { type: "spring" as const, stiffness: 300, damping: 30 };

export default function AnalyticsPage() {
  return (
    <>
      <motion.main
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springConfig}
        className="relative max-w-md lg:max-w-5xl mx-auto px-4 pb-28 lg:pb-12 min-h-dvh pt-2 lg:pt-8"
      >
        <div className="lg:hidden">
            <Header />
        </div>

        <section className="mb-6">
          <h1 className="font-serif text-2xl text-text-primary mb-1">Аналитика</h1>
          <p className="text-xs text-text-muted font-sans uppercase tracking-widest">Баланс сфер & XP</p>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-12 mt-4 lg:mt-8">
            <div className="flex flex-col gap-6">
                <section>
                    <ProductivityRadar />
                </section>
                <section>
                    <XpProgressBar />
                </section>
            </div>

            <div className="flex flex-col">
                {/* Placeholder for future charts */}
                <section className="bg-surface-2 border border-gunmetal/50 rounded-2xl p-6 lg:p-12 text-center shadow-lg shadow-black/10 flex-1 flex flex-col items-center justify-center">
                    <p className="text-4xl lg:text-5xl mb-4 opacity-80">📈</p>
                    <p className="font-serif text-lg lg:text-2xl text-text-primary mb-2">История XP</p>
                    <p className="text-sm text-text-muted font-sans max-w-xs mx-auto">Детальная кросс-аналитика и тепловые карты появятся в следующем обновлении.</p>
                </section>
            </div>
        </div>
      </motion.main>
      <BottomNav />
    </>
  );
}
