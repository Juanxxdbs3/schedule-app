import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../features/auth/hooks/useAuth.tsx";
import { useHorarioStore } from "../../features/horario/store/horarioStore.ts";

export default function NavBar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const horario = useHorarioStore((s) => s.horario);

  function linkClasses(isActive: boolean): string {
    return `text-sm no-underline py-0.5 border-b-2 transition-colors duration-150 ${
      isActive ? "text-primary border-primary font-semibold" : "text-muted border-transparent font-medium"
    }`;
  }

  return (
    <nav className="flex items-center justify-between px-4 h-14 bg-surface border-b border-border sticky top-0 z-[100]">
      <div className="flex items-center gap-4">
        <Link to="/" className="font-bold text-lg text-text no-underline">
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
        <span className="text-sm text-muted">
          {user?.username}
        </span>
        <button
          type="button"
          onClick={logout}
          className="px-4 py-1.5 bg-primary text-white border-none rounded-md cursor-pointer text-sm font-medium"
        >
          Cerrar sesión
        </button>
      </div>
    </nav>
  );
}
