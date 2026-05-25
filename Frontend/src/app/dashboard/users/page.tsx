"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./users.module.css";

const BACKEND_URL = "http://localhost:5028";
const ROLES = ["Admin", "Empleado"];

interface FormErrors {
  username?: string;
  password?: string;
  confirmPassword?: string;
}

function validate(
  username: string,
  password: string,
  confirmPassword: string
): FormErrors {
  const errors: FormErrors = {};

  if (!username.trim()) {
    errors.username = "El nombre de usuario es obligatorio.";
  }

  if (!password) {
    errors.password = "La contraseña es obligatoria.";
  } else if (password.length < 8) {
    errors.password = "La contraseña debe tener al menos 8 caracteres.";
  }

  if (!confirmPassword) {
    errors.confirmPassword = "Debe confirmar la contraseña.";
  } else if (password !== confirmPassword) {
    errors.confirmPassword = "Las contraseñas no coinciden.";
  }

  return errors;
}

export default function GestionUsuarios() {
  const [rolSesion, setRolSesion] = useState("");
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rolNuevo, setRolNuevo] = useState("Empleado");

  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [serverMessage, setServerMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const isAuthenticated = localStorage.getItem("isAuthenticated");
    const rolGuardado = localStorage.getItem("rol") ?? "";

    if (!isAuthenticated || rolGuardado !== "Admin") {
      router.push("/dashboard");
      return;
    }

    setRolSesion(rolGuardado);
  }, [router]);

  if (rolSesion !== "Admin") return null;

  const clearFieldError = (field: keyof FormErrors) => {
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerMessage("");

    const validationErrors = validate(username, password, confirmPassword);
    if (Object.keys(validationErrors).length > 0) {
      if (password && confirmPassword && password !== confirmPassword) {
        setPassword("");
        setConfirmPassword("");
      }
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const res = await fetch(`${BACKEND_URL}/api/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
          confirmPassword,
          rol: rolNuevo,
        }),
      });

      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem("isAuthenticated");
        localStorage.removeItem("idUsuario");
        localStorage.removeItem("username");
        localStorage.removeItem("rol");
        router.push("/");
        return;
      }

      const data = await res.json();

      if (res.status === 201) {
        setServerMessage(`Usuario "${data.username}" creado exitosamente.`);
        setIsSuccess(true);
        setUsername("");
        setPassword("");
        setConfirmPassword("");
        setRolNuevo("Empleado");
      } else if (res.status === 409) {
        setServerMessage("El nombre de usuario ya existe.");
        setIsSuccess(false);
      } else if (res.status === 400) {
        setServerMessage(data.message ?? "Datos inválidos. Revise los campos.");
        setIsSuccess(false);
      } else {
        setServerMessage("Error inesperado. Intente de nuevo.");
        setIsSuccess(false);
      }
    } catch {
      setServerMessage("Error de conexión con el servidor.");
      setIsSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Usuarios</h1>
        <p className={styles.subtitle}>Crear nuevo usuario</p>
      </div>

      <div className={styles.card}>
        <form
          className={styles.form}
          onSubmit={handleSubmit}
          noValidate
          aria-label="Formulario de creación de usuario"
        >
          <div className={styles.field}>
            <label className={styles.label} htmlFor="username">Usuario</label>
            <input
              className={`${styles.input} ${errors.username ? styles.inputError : ""}`}
              id="username"
              type="text"
              name="username"
              placeholder="Ej: jperez"
              autoComplete="username"
              value={username}
              maxLength={50}
              onChange={(e) => {
                setUsername(e.target.value);
                clearFieldError("username");
              }}
            />
            {errors.username && <span className={styles.errorText}>{errors.username}</span>}
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="password">Contraseña</label>
            <input
              className={`${styles.input} ${errors.password ? styles.inputError : ""}`}
              id="password"
              type="password"
              name="password"
              placeholder="Mínimo 8 caracteres"
              autoComplete="new-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearFieldError("password");
              }}
            />
            {errors.password && <span className={styles.errorText}>{errors.password}</span>}
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="confirmPassword">Confirmar contraseña</label>
            <input
              className={`${styles.input} ${errors.confirmPassword ? styles.inputError : ""}`}
              id="confirmPassword"
              type="password"
              name="confirmPassword"
              placeholder="Repita la contraseña"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                clearFieldError("confirmPassword");
              }}
            />
            {errors.confirmPassword && (
              <span className={styles.errorText}>{errors.confirmPassword}</span>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="rol">Rol</label>
            <select
              className={styles.select}
              id="rol"
              name="rol"
              value={rolNuevo}
              onChange={(e) => setRolNuevo(e.target.value)}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {serverMessage && (
            <p className={isSuccess ? styles.messageSuccess : styles.messageError}>
              {serverMessage}
            </p>
          )}

          <button
            className={`${styles.btn} ${styles.btnPrimary}`}
            type="submit"
            disabled={loading}
          >
            {loading ? "Creando..." : "Crear usuario"}
          </button>
        </form>
      </div>

      <button
        className={`${styles.btn} ${styles.btnSecondary}`}
        style={{ width: "min(360px, 94vw)" }}
        onClick={() => router.push("/dashboard")}
      >
        ← Volver al Dashboard
      </button>
    </div>
  );
}
