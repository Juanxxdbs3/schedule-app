import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../features/auth/hooks/useAuth.tsx";
import { useHorarioStore } from "../../features/horario/store/horarioStore.ts";

export default function NavBar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const horario = useHorarioStore((s) => s.horario);

  const linkStyle = (isActive: boolean): React.CSSProperties => ({
    color: isActive ? "var(--color-primary)" : "var(--color-text-muted)",
    textDecoration: "none",
    fontSize: "var(--font-size-sm)",
    fontWeight: isActive ? 600 : 500,
    padding: "0.25rem 0",
    borderBottom: isActive ? "2px solid var(--color-primary)" : "2px solid transparent",
    transition: "color 0.15s, border-color 0.15s",
  });

  return (
    <nav
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 var(--spacing-4)",
        height: 56,
        background: "var(--color-surface)",
        borderBottom: "1px solid var(--color-border)",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-4)" }}>
        <Link
          to="/"
          style={{
            fontWeight: 700,
            fontSize: "var(--font-size-lg)",
            color: "var(--color-text)",
            textDecoration: "none",
          }}
        >
          Horario App
        </Link>

        <Link to="/" style={linkStyle(location.pathname === "/")}>
          Dashboard
        </Link>

        {horario && (
          <Link
            to={`/horario/${horario.id}`}
            style={linkStyle(location.pathname.startsWith(`/horario/${horario.id}`))}
          >
            Horario actual
          </Link>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-3)" }}>
        <span style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)" }}>
          {user?.username}
        </span>
        <button
          type="button"
          onClick={logout}
          style={{
            padding: "0.4rem 1rem",
            background: "var(--color-primary)",
            color: "#fff",
            border: "none",
            borderRadius: "var(--radius-md)",
            cursor: "pointer",
            fontSize: "var(--font-size-sm)",
            fontWeight: 500,
          }}
        >
          Cerrar sesión
        </button>
      </div>
    </nav>
  );
}
