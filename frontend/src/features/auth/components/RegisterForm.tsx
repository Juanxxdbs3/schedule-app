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
    <div className="max-w-sm mx-auto p-8">
      <h1>Crear cuenta</h1>

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
          <label htmlFor="username" className="block mb-1">
            Nombre de usuario
          </label>
          <input
            id="username"
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-2 box-border"
          />
        </div>

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

        <div className="mb-4">
          <label htmlFor="confirm-password" className="block mb-1">
            Confirmar contraseña
          </label>
          <input
            id="confirm-password"
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full p-2 box-border"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className={`w-full p-2 text-white border-none rounded-md ${
            submitting ? "cursor-not-allowed" : "cursor-pointer"
          } bg-primary`}
        >
          {submitting ? "Creando cuenta..." : "Crear cuenta"}
        </button>
      </form>

      <p className="mt-4 text-center">
        ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
      </p>
    </div>
  );
}
