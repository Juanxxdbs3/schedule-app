import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./features/auth/hooks/useAuth.tsx";
import LoginForm from "./features/auth/components/LoginForm.tsx";
import RegisterForm from "./features/auth/components/RegisterForm.tsx";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ textAlign: "center", padding: "2rem" }}>Cargando...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "2rem 1rem" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Horario App</h1>
        <div>
          <span style={{ marginRight: "1rem", color: "var(--color-text-muted)" }}>
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
            }}
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <main style={{ marginTop: "2rem" }}>
        <div
          style={{
            padding: "3rem 2rem",
            textAlign: "center",
            border: "2px dashed var(--color-border)",
            borderRadius: "var(--radius-md)",
            color: "var(--color-text-muted)",
          }}
        >
          <h2>Bienvenido a Horario App</h2>
          <p>Aquí podrás cargar tu pensum y organizar tu horario de clases.</p>
          <p style={{ marginTop: "1rem", fontSize: "var(--font-size-sm)" }}>
            Próximamente: carga de pensum y editor de horario.
          </p>
        </div>
      </main>
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginForm />} />
      <Route path="/register" element={<RegisterForm />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
