import { useState, useEffect } from "react";
import type { SyntheticEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.tsx";

export default function LoginForm() {
  const { user, login, error, clearError } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { clearError(); }, [clearError]);
  useEffect(() => { if (user) navigate("/", { replace: true }); }, [user, navigate]);

  async function handleSubmit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      await login(email, password);
      navigate("/", { replace: true });
    } catch {
      // error ya se guarda en el hook
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: "0 auto", padding: "2rem 1rem" }}>
      <h1>Iniciar sesión</h1>

      {error && (
        <div style={{ color: "var(--color-danger)", marginBottom: "1rem" }}>
          {error}
          <button
            type="button"
            onClick={clearError}
            style={{ marginLeft: 8, background: "none", border: "none", cursor: "pointer" }}
          >
            ✕
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "1rem" }}>
          <label htmlFor="email" style={{ display: "block", marginBottom: 4 }}>
            Correo electrónico
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%", padding: "0.5rem", boxSizing: "border-box" }}
          />
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label htmlFor="password" style={{ display: "block", marginBottom: 4 }}>
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%", padding: "0.5rem", boxSizing: "border-box" }}
          />
        </div>

        <button
          type="submit"
          disabled={submitting || loading}
          style={{
            width: "100%",
            padding: "0.5rem",
            background: "var(--color-primary)",
            color: "#fff",
            border: "none",
            borderRadius: "var(--radius-md)",
            cursor: submitting ? "not-allowed" : "pointer",
          }}
        >
          {submitting ? "Ingresando..." : "Iniciar sesión"}
        </button>
      </form>

      <p style={{ marginTop: "1rem", textAlign: "center" }}>
        ¿No tienes cuenta? <Link to="/register">Regístrate</Link>
      </p>
    </div>
  );
}
