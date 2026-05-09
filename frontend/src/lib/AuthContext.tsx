"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { useRouter, usePathname } from "next/navigation";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Получить сессию при монтировании
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    };

    fetchSession();

    // Слушать изменения статуса авторизации
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Защита маршрутов
  useEffect(() => {
    if (!loading) {
      const isAuthRoute = pathname === "/login" || pathname === "/register";
      
      if (!user && !isAuthRoute) {
        // Если не вошел и не на странице авторизации -> кидаем на логин
        router.push("/login");
      } else if (user && isAuthRoute) {
        // Если вошел, но почему-то на странице логина -> кидаем в обзор
        router.push("/");
      }
    }
  }, [user, loading, pathname, router]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {/* Пока загружается профиль и не на странице логина — показываем спиннер */}
      {loading && pathname !== "/login" && pathname !== "/register" ? (
        <div className="flex h-screen w-full items-center justify-center bg-surface-1">
          <div className="w-8 h-8 rounded-full border-2 border-gunmetal border-t-copper animate-spin" />
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
