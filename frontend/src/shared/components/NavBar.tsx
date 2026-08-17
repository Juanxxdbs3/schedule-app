import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Moon, Sun } from "lucide-react";
import { useAuth } from "../../features/auth/hooks/useAuth.tsx";
import { useHorarioStore } from "../../features/horario/store/horarioStore.ts";
import { useTheme } from "../hooks/useTheme.ts";

export default function NavBar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const horario = useHorarioStore((s) => s.horario);
  const { theme, toggle } = useTheme();
  const [menuAbierto, setMenuAbierto] = useState(false);

  function linkClasses(isActive: boolean): string {
    return `text-sm no-underline py-0.5 border-b-2 transition-colors duration-150 ${
      isActive ? "text-primary border-primary font-semibold" : "text-muted border-transparent font-medium"
    }`;
  }

  const links = (
    <>
      <Link to="/" onClick={() => setMenuAbierto(false)} className={linkClasses(location.pathname === "/")}>
        Dashboard
      </Link>
      {horario && (
        <Link
          to={`/horario/${horario.id}`}
          onClick={() => setMenuAbierto(false)}
          className={linkClasses(location.pathname.startsWith(`/horario/${horario.id}`))}
        >
          Horario actual
        </Link>
      )}
    </>
  );

  return (
    <nav className="relative flex items-center justify-between px-4 h-14 bg-surface border-b border-border sticky top-0 z-[100]">
      <div className="flex items-center gap-4">
        <Link to="/" className="font-heading font-bold text-lg text-text no-underline">
          Horario App
        </Link>
        <div className="hidden md:flex items-center gap-4">{links}</div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggle}
          title={theme === "dark" ? "Modo claro" : "Modo oscuro"}
          className="hidden md:flex w-9 h-9 items-center justify-center bg-transparent text-muted border border-border rounded-md cursor-pointer hover:text-primary hover:border-primary transition-colors duration-150"
        >
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
        <span className="hidden md:inline text-sm text-muted">
          {user?.username}
        </span>
        <button
          type="button"
          onClick={logout}
          className="hidden md:block btn-primary px-4 py-2 bg-primary text-white border-none rounded-md cursor-pointer text-sm font-medium"
        >
          Cerrar sesión
        </button>
        <button
          type="button"
          onClick={() => setMenuAbierto((p) => !p)}
          aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
          className="md:hidden w-9 h-9 flex items-center justify-center bg-transparent text-muted border border-border rounded-md cursor-pointer hover:text-primary hover:border-primary transition-colors duration-150"
        >
          {menuAbierto ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {menuAbierto && (
        <div className="absolute top-14 left-0 right-0 md:hidden bg-surface border-b border-border shadow-lg flex flex-col p-4 gap-3">
          {links}
          <div className="flex items-center gap-3 pt-3 border-t border-border">
            <button
              type="button"
              onClick={toggle}
              title={theme === "dark" ? "Modo claro" : "Modo oscuro"}
              className="w-10 h-10 shrink-0 flex items-center justify-center bg-transparent text-muted border border-border rounded-md cursor-pointer hover:text-primary hover:border-primary transition-colors duration-150"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <span className="text-sm text-muted min-w-0 truncate">{user?.username}</span>
            <button
              type="button"
              onClick={logout}
              className="btn-primary flex-1 px-4 py-2 bg-primary text-white border-none rounded-md cursor-pointer text-sm font-medium"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
