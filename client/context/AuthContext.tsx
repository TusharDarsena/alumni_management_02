import React, { createContext, useContext, useEffect, useState } from "react";

type User = {
  username: string;
  email?: string;
  phone?: string;
  location?: string;
  role: string;
  mustChangePassword?: boolean;
  defaultPassword?: boolean;
} | null;

type AuthContextType = {
  user: User;
  loading: boolean;
  login: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/auth/verify", { credentials: "include" });
      const data = await res.json();
      if (data.status) {
        setUser({
          username: data.user.username,
          email: data.user.email,
          phone: data.user.phone,
          location: data.user.location,
          role: data.user.role,
          mustChangePassword: data.user.mustChangePassword,
          defaultPassword: data.user.defaultPassword,
        });
      } else {
        setUser(null);
      }
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json();
        return { success: false, message: err.message || "Login failed" };
      }
      // server sets httpOnly cookie; now refresh user
      await refresh();
      return { success: true };
    } catch (err) {
      return { success: false, message: "Network error" };
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      // ignore
    }
    setUser(null);
    // prevent forward-button access to protected pages
    try {
      window.history.replaceState(null, '', window.location.href);
      window.location.href = '/login';
    } catch (e) {
      // ignore in non-browser env
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
};
