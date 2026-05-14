"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const BACKEND_URL = "http://localhost:5149";

const ROLES = ["Admin", "Empleado"];

const fieldStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "4px",
  width: "100%",
};

const labelStyle: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: 600,
  color: "#333",
};

function inputStyle(hasError: boolean): React.CSSProperties {
  return {
    padding: "8px 10px",
    borderRadius: "4px",
    border: `1px solid ${hasError ? "#c53030" : "#ccc"}`,
    fontSize: "14px",
    width: "100%",
    boxSizing: "border-box",
    outline: "none",
  };
}

const errorTextStyle: React.CSSProperties = {
  fontSize: "12px",
  color: "#c53030",
  margin: 0,
};

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
    const token = localStorage.getItem("token");
    const rolGuardado = localStorage.getItem("rol") ?? "";

    if (!token || rolGuardado !== "Admin") {
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
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setLoading(true);
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`${BACKEND_URL}/api/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username,
          password,
          confirmPassword,
          rol: rolNuevo,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setServerMessage(`Usuario "${data.username}" creado exitosamente.`);
        setIsSuccess(true);
        setUsername("");
        setPassword("");
        setConfirmPassword("");
        setRolNuevo("Empleado");
      } else {
        setServerMessage(data.message ?? "Error al crear el usuario.");
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
    <main style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "Tahoma, Verdana, sans-serif",
      background: "#f7f7f7",
      gap: "16px",
    }}>
      <h1 style={{ fontSize: "22px", fontWeight: 600 }}>Gestión de Usuarios</h1>
      <p style={{ color: "#6a6a6a", fontSize: "14px" }}>Crear nuevo usuario</p>

      <form
        onSubmit={handleSubmit}
        noValidate
        aria-label="Formulario de creación de usuario"
        style={{
          background: "#fff",
          padding: "28px 32px",
          borderRadius: "8px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          width: "320px",
        }}
      >
        <div style={fieldStyle}>
          <label style={labelStyle} htmlFor="username">Usuario</label>
          <input
            style={inputStyle(!!errors.username)}
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
          {errors.username && <p style={errorTextStyle}>{errors.username}</p>}
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle} htmlFor="password">Contraseña</label>
          <input
            style={inputStyle(!!errors.password)}
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
          {errors.password && <p style={errorTextStyle}>{errors.password}</p>}
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle} htmlFor="confirmPassword">Confirmar contraseña</label>
          <input
            style={inputStyle(!!errors.confirmPassword)}
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
            <p style={errorTextStyle}>{errors.confirmPassword}</p>
          )}
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle} htmlFor="rol">Rol</label>
          <select
            style={inputStyle(false)}
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
          <p style={{
            color: isSuccess ? "#276749" : "#c53030",
            fontSize: "13px",
            margin: 0,
          }}>
            {serverMessage}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "9px 0",
            borderRadius: "4px",
            border: "none",
            background: loading ? "#a0aec0" : "#2a4a7f",
            color: "#fff",
            fontSize: "14px",
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Creando..." : "Crear usuario"}
        </button>
      </form>

      <button
        onClick={() => router.push("/dashboard")}
        style={{
          marginTop: "8px",
          padding: "8px 24px",
          borderRadius: "4px",
          border: "1px solid #2a4a7f",
          background: "transparent",
          color: "#2a4a7f",
          fontSize: "14px",
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        ← Volver al Dashboard
      </button>
    </main>
  );
}
