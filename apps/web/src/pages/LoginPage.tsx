import { FormEvent, useState } from "react";
import { loginRequest } from "../lib/auth";

interface LoginPageProps {
  onSuccess: () => void;
}

export function LoginPage({ onSuccess }: LoginPageProps) {
  const [email, setEmail] = useState("admin@saa.com.py");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await loginRequest({ email, password });
      onSuccess();
    } catch (currentError) {
      setError(currentError instanceof Error ? currentError.message : "No se pudo iniciar sesion.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-layout">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="brand-mark">ST</div>
        <h1>Acceso administrativo</h1>
        <p>Inicia sesion con tu usuario de la base de datos para administrar el sistema.</p>

        <label>
          Email
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>

        <label>
          Contrasena
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
        </label>

        {error ? <div className="login-error">{error}</div> : null}

        <button className="primary-button login-button" disabled={loading} type="submit">
          {loading ? "Ingresando..." : "Ingresar"}
        </button>
      </form>
    </div>
  );
}
