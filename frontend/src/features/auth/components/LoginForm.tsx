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
    <div className="max-w-sm mx-auto p-8">
      <h1>Iniciar sesión</h1>

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
          <label htmlFor="email" className="block mb-1">
            Correo electrónico
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 box-border"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="password" className="block mb-1">
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 box-border"
          />
        </div>

        <button
          type="submit"
          disabled={submitting || loading}
          className={`w-full p-2 text-white border-none rounded-md ${
            submitting ? "cursor-not-allowed" : "cursor-pointer"
          } bg-primary`}
        >
          {submitting ? "Ingresando..." : "Iniciar sesión"}
        </button>
      </form>

      <p className="mt-4 text-center">
        ¿No tienes cuenta? <Link to="/register">Regístrate</Link>
      </p>
    </div>
  );
}
