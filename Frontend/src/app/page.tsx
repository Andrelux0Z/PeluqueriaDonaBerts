"use client";
import { useState } from "react";
import styles from "./page.module.css";
import { useRouter } from "next/navigation";

export default function Home() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      // URL del backend configurada para el ambiente de desarrollo
      const res = await fetch("http://localhost:5028/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ usuario: username, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setMessage("Login exitoso! Bienvenido.");
        setIsSuccess(true);
        // Almacenamiento de estado de sesión en cliente
        localStorage.setItem("isAuthenticated", "true");
        localStorage.setItem("idUsuario", data.idUsuario.toString());
        // Redireccionamiento posterior al inicio de sesión
        router.push("/empleados");
      } else {
        if (data.message) {
          setMessage(data.message);
        } else {
          setMessage("Credenciales incorrectas");
        }
        setIsSuccess(false);
      }
    } catch (error) {
      console.error(error);
      setMessage("Error de conexión con el backend.");
      setIsSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  let buttonText = "Confirmar";
  if (loading) {
    buttonText = "Cargando...";
  }

  let messageColor = "red";
  if (isSuccess) {
    messageColor = "green";
  }

  return (
    <div className={styles.page}>
      <main className={styles.card}>
        <h1 className={styles.title}>Iniciar sesión</h1>

        <form className={styles.form} onSubmit={handleLogin} aria-label="Formulario de inicio de sesión">
          <div className={styles.field}>
            <label className={styles.label} htmlFor="username">
              Usuario:
            </label>
            <input
              className={styles.input}
              id="username"
              type="text"
              name="username"
              placeholder="Ejemplo: usuario"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="password">
              Contraseña:
            </label>
            <input
              className={styles.input}
              id="password"
              type="password"
              name="password"
              placeholder="********"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {message && (
            <p style={{ color: messageColor, marginTop: "1rem", textAlign: "center" }}>
              {message}
            </p>
          )}

          <div className={styles.actions}>
            <button className={styles.button} type="submit" disabled={loading}>
              {buttonText}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
