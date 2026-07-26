import { useState, useEffect } from "react";
import type { SyntheticEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.tsx";

export default function RegisterForm() {
  const { register, error, clearError } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { clearError(); }, [clearError]);

  async function handleSubmit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setValidationError(null);
    clearError();

    if (password !== confirmPassword) {
      setValidationError("Las contraseñas no coinciden");
      return;
    }

    if (password.length < 6) {
      setValidationError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    if (submitting) return;
    setSubmitting(true);
    try {
      await register(username, email, password);
      navigate("/login");
    } catch {
      // error ya se guarda en el hook
    } finally {
      setSubmitting(false);
    }
  }

  const displayError = validationError || error;

  return (
    <div style={{ maxWidth: 400, margin: "0 auto", padding: "2rem 1rem" }}>
      <h1>Crear cuenta</h1>

      {displayError && (
        <div style={{ color: "var(--color-danger)", marginBottom: "1rem" }}>
          {displayError}
          <button
            type="button"
            onClick={() => { clearError(); setValidationError(null); }}
            style={{ marginLeft: 8, background: "none", border: "none", cursor: "pointer" }}
          >
            ✕
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "1rem" }}>
          <label htmlFor="username" style={{ display: "block", marginBottom: 4 }}>
            Nombre de usuario
          </label>
          <input
            id="username"
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ width: "100%", padding: "0.5rem", boxSizing: "border-box" }}
          />
        </div>

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

        <div style={{ marginBottom: "1rem" }}>
          <label htmlFor="confirm-password" style={{ display: "block", marginBottom: 4 }}>
            Confirmar contraseña
          </label>
          <input
            id="confirm-password"
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            style={{ width: "100%", padding: "0.5rem", boxSizing: "border-box" }}
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
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
          {submitting ? "Creando cuenta..." : "Crear cuenta"}
        </button>
      </form>

      <p style={{ marginTop: "1rem", textAlign: "center" }}>
        ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
      </p>
    </div>
  );
}
