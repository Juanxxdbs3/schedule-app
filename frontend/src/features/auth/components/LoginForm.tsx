import { useState, useEffect } from "react";
import type { SyntheticEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.tsx";

export default function LoginForm() {
  const { user, login, loading, error, clearError } = useAuth();
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
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-sm border border-border rounded-lg p-5 bg-surface">
        <h1 className="mt-0">Iniciar sesión</h1>

        {error && (
          <div className="text-danger mb-4">
            {error}
            <button
              type="button"
              onClick={clearError}
              className="ml-2 bg-none border-none cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="block mb-1 text-sm text-muted font-medium">
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border border-border rounded-md bg-surface text-text"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="password" className="block mb-1 text-sm text-muted font-medium">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border border-border rounded-md bg-surface text-text"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || loading}
            className={`w-full p-2 text-white border-none rounded-md font-medium ${
              submitting ? "cursor-not-allowed bg-muted-block" : "cursor-pointer bg-primary"
            }`}
          >
            {submitting ? "Ingresando..." : "Iniciar sesión"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm">
          ¿No tienes cuenta? <Link to="/register" className="text-primary no-underline">Regístrate</Link>
        </p>
      </div>
    </div>
  );
}
