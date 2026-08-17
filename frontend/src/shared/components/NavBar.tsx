import { Link, useLocation } from "react-router-dom";
import { Moon, Sun } from "lucide-react";
import { useAuth } from "../../features/auth/hooks/useAuth.tsx";
import { useHorarioStore } from "../../features/horario/store/horarioStore.ts";
import { useTheme } from "../hooks/useTheme.ts";

export default function NavBar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const horario = useHorarioStore((s) => s.horario);
  const { theme, toggle } = useTheme();

  function linkClasses(isActive: boolean): string {
    return `text-sm no-underline py-0.5 border-b-2 transition-colors duration-150 ${
      isActive ? "text-primary border-primary font-semibold" : "text-muted border-transparent font-medium"
    }`;
  }

  return (
    <nav className="flex items-center justify-between px-4 h-14 bg-surface border-b border-border sticky top-0 z-[100]">
      <div className="flex items-center gap-4">
        <Link to="/" className="font-heading font-bold text-lg text-text no-underline">
          Horario App
        </Link>

        <Link to="/" className={linkClasses(location.pathname === "/")}>
          Dashboard
        </Link>

        {horario && (
          <Link
            to={`/horario/${horario.id}`}
            className={linkClasses(location.pathname.startsWith(`/horario/${horario.id}`))}
          >
            Horario actual
          </Link>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggle}
          title={theme === "dark" ? "Modo claro" : "Modo oscuro"}
          className="w-9 h-9 flex items-center justify-center bg-transparent text-muted border border-border rounded-md cursor-pointer hover:text-primary hover:border-primary transition-colors duration-150"
        >
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
        <span className="text-sm text-muted">
          {user?.username}
        </span>
        <button
          type="button"
          onClick={logout}
          className="btn-primary px-4 py-2 bg-primary text-white border-none rounded-md cursor-pointer text-sm font-medium"
        >
          Cerrar sesión
        </button>
      </div>
    </nav>
  );
}
