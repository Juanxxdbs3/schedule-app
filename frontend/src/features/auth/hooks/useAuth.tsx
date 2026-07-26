import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { AuthService, type Usuario } from "../services/AuthService.ts";

interface AuthContextValue {
  user: Usuario | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    AuthService.me()
      .then((res) => setUser(res.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    try {
      await AuthService.login({ email, password });
      const res = await AuthService.me();
      setUser(res.user);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al iniciar sesión";
      setError(message);
      throw err;
    }
  }, []);

  const register = useCallback(async (username: string, email: string, password: string) => {
    setError(null);
    try {
      await AuthService.register({ username, email, password });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al registrarse";
      setError(message);
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    setError(null);
    try {
      await AuthService.logout();
      setUser(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al cerrar sesión";
      setError(message);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider");
  }
  return ctx;
}
