import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { authApi } from "@/lib/api";

interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: string;
  isVerified: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; fullName: string; phone?: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setUser(null);
        return;
      }
      const res = await authApi.getMe();
      if (res.success && res.data) {
        setUser(res.data as User);
      }
    } catch {
      setUser(null);
      localStorage.removeItem("accessToken");
    }
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setIsLoading(false));
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    const data = res.data as { user: User; accessToken: string };
    localStorage.setItem("accessToken", data.accessToken);
    setUser(data.user);
  };

  const register = async (body: { email: string; password: string; fullName: string; phone?: string }) => {
    const res = await authApi.register(body);
    const data = res.data as { user: User; accessToken: string };
    localStorage.setItem("accessToken", data.accessToken);
    setUser(data.user);
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    }
    localStorage.removeItem("accessToken");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        isAdmin: user?.role === "ADMIN",
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
