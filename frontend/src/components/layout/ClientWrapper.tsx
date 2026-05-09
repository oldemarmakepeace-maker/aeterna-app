"use client";

import { usePathname } from "next/navigation";
import { AuthProvider } from "@/lib/AuthContext";
import { CategoryProvider } from "@/lib/CategoryContext";
import Sidebar from "@/components/layout/Sidebar";

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/register";

  return (
    <AuthProvider>
      <CategoryProvider>
        <div className={isAuthPage ? "" : "md:pl-24 lg:pl-64 transition-all duration-300"}>
          {!isAuthPage && <Sidebar />}
          {children}
        </div>
      </CategoryProvider>
    </AuthProvider>
  );
}
