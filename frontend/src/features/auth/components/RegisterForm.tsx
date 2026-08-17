import { useState, useEffect } from "react";
import type { SyntheticEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.tsx";

export default function RegisterForm() {
  const { user, register, error, clearError } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { if (user) navigate("/", { replace: true }); }, [user, navigate]);
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
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-sm mx-4 border border-border rounded-lg p-5 bg-surface">
        <h1 className="mt-0">Crear cuenta</h1>

        {displayError && (
          <div className="text-danger mb-4">
            {displayError}
            <button
              type="button"
              onClick={() => { clearError(); setValidationError(null); }}
              className="ml-2 bg-none border-none cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="username" className="block mb-1 text-sm text-muted font-medium">
              Nombre de usuario
            </label>
            <input
              id="username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-2 border border-border rounded-md bg-surface text-text"
            />
          </div>

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

          <div className="mb-4">
            <label htmlFor="confirm-password" className="block mb-1 text-sm text-muted font-medium">
              Confirmar contraseña
            </label>
            <input
              id="confirm-password"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full p-2 border border-border rounded-md bg-surface text-text"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className={`btn-primary w-full px-3 py-2.5 text-white border-none rounded-md font-medium ${
              submitting ? "cursor-not-allowed bg-muted-block" : "cursor-pointer bg-primary"
            }`}
          >
            {submitting ? "Creando cuenta..." : "Crear cuenta"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm">
          ¿Ya tienes cuenta? <Link to="/login" className="text-primary no-underline">Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
}
