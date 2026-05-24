"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const BACKEND_URL = "http://localhost:5028";

interface Configuracion {
  id: number;
  nombreServicio: string;
  precioBase: number;
}

interface Servicio {
  id: number;
  fecha: string;
  tipoServicio: string;
  nombreLibre: string;
  monto: number;
}

interface FormErrors {
  fecha?: string;
  configuracion?: string;
  descripcion?: string;
  montoCobrado?: string;
}

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

function validate(fecha: string, configuracion: number | "", descripcion: string, montoCobrado: string): FormErrors {
  const errors: FormErrors = {};

  if (!fecha) {
    errors.fecha = "La fecha es obligatoria.";
  }

  if (configuracion === "") {
    errors.configuracion = "Debe seleccionar una configuración.";
  }

  if (!descripcion.trim()) {
    errors.descripcion = "La descripción es obligatoria.";
  } else if (descripcion.trim().length > 255) {
    errors.descripcion = "La descripción no puede superar los 255 caracteres.";
  }

  if (montoCobrado === "" || montoCobrado === undefined) {
    errors.montoCobrado = "El monto es obligatorio.";
  } else if (isNaN(Number(montoCobrado)) || Number(montoCobrado) < 0) {
    errors.montoCobrado = "El monto debe ser un número mayor o igual a cero.";
  }

  return errors;
}

export default function RegistroServicios() {
  const router = useRouter();
  const [idUsuario, setIdUsuario] = useState(0);

  const [fecha, setFecha] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [montoCobrado, setMontoCobrado] = useState("");
  const [idConfiguracion, setIdConfiguracion] = useState<number | "">("");

  const [configuraciones, setConfiguraciones] = useState<Configuracion[]>([]);
  const [historial, setHistorial] = useState<Servicio[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [serverMessage, setServerMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const isAuthenticated = localStorage.getItem("isAuthenticated");
    if (!isAuthenticated) {
      router.push("/");
      return;
    }
    setIdUsuario(parseInt(localStorage.getItem("idUsuario") ?? "0"));
    cargarConfiguraciones();
    cargarHistorial();
  }, [router]);

  async function cargarConfiguraciones() {
    try {
      const res = await fetch(`${BACKEND_URL}/api/servicios/configuraciones`);
      if (res.ok) {
        const data = await res.json();
        setConfiguraciones(data);
      }
    } catch {}
  }

  async function cargarHistorial() {
    try {
      const res = await fetch(`${BACKEND_URL}/api/servicios`);
      if (res.ok) {
        const data = await res.json();
        setHistorial(data);
      }
    } catch {}
  }

  function clearFieldError(field: keyof FormErrors) {
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerMessage("");

    const validationErrors = validate(fecha, idConfiguracion, descripcion, montoCobrado);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    setLoading(true);

    try {
      const body = {
        fecha: new Date(fecha).toISOString(),
        descripcion: descripcion.trim(),
        montoCobrado: Number(montoCobrado),
        idConfiguracion: idConfiguracion !== "" ? idConfiguracion : null,
        idPostByUser: idUsuario,
      };

      const res = await fetch(`${BACKEND_URL}/api/servicios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.status === 201) {
        setServerMessage("Servicio registrado correctamente.");
        setIsSuccess(true);
        setFecha("");
        setDescripcion("");
        setMontoCobrado("");
        setIdConfiguracion("");
        await cargarHistorial();
      } else if (res.status === 400) {
        const data = await res.json();
        setServerMessage(data.message ?? "Datos inválidos. Revise los campos.");
        setIsSuccess(false);
      } else {
        const data = await res.json();
        setServerMessage(data.message ?? "Error inesperado. Intente de nuevo.");
        setIsSuccess(false);
      }
    } catch {
      setServerMessage("Error de conexión con el servidor.");
      setIsSuccess(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{
      minHeight: "100vh",
      fontFamily: "Tahoma, Verdana, sans-serif",
      background: "#f7f7f7",
      padding: "32px 24px",
    }}>
      <div style={{ maxWidth: "900px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "32px" }}>

        {/* Encabezado */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1 style={{ fontSize: "22px", fontWeight: 600, margin: 0 }}>Registro de Servicios</h1>
          <button
            onClick={() => router.push("/dashboard")}
            style={{
              padding: "7px 18px",
              borderRadius: "4px",
              border: "1px solid #2a4a7f",
              background: "transparent",
              color: "#2a4a7f",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            ← Volver al Dashboard
          </button>
        </div>

        {/* Formulario */}
        <section style={{
          background: "#fff",
          borderRadius: "8px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          padding: "28px 32px",
        }}>
          <h2 style={{ fontSize: "16px", fontWeight: 600, margin: "0 0 20px" }}>Nuevo servicio</h2>
          <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

            {/* Fecha */}
            <div style={fieldStyle}>
              <label style={labelStyle} htmlFor="fecha">Fecha</label>
              <input
                style={inputStyle(!!errors.fecha)}
                id="fecha"
                type="date"
                value={fecha}
                onChange={(e) => { setFecha(e.target.value); clearFieldError("fecha"); }}
              />
              {errors.fecha && <p style={errorTextStyle}>{errors.fecha}</p>}
            </div>

            {/* Configuración preestablecida */}
            <div style={fieldStyle}>
              <label style={labelStyle} htmlFor="configuracion">Configuración preestablecida</label>
              <select
                style={inputStyle(!!errors.configuracion)}
                id="configuracion"
                value={idConfiguracion}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "") {
                    setIdConfiguracion("");
                  } else {
                    const id = Number(val);
                    setIdConfiguracion(id);
                    const config = configuraciones.find((c) => c.id === id);
                    if (config) setMontoCobrado(config.precioBase.toString());
                  }
                  clearFieldError("configuracion");
                }}
              >
                <option value="">— Seleccione —</option>
                {configuraciones.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombreServicio} — ₡{c.precioBase.toFixed(2)}
                  </option>
                ))}
              </select>
              {errors.configuracion && <p style={errorTextStyle}>{errors.configuracion}</p>}
            </div>

            {/* Descripción */}
            <div style={fieldStyle}>
              <label style={labelStyle} htmlFor="descripcion">Descripción</label>
              <textarea
                style={{
                  ...inputStyle(!!errors.descripcion),
                  resize: "vertical",
                  minHeight: "80px",
                  fontFamily: "inherit",
                }}
                id="descripcion"
                placeholder="Describe el servicio realizado..."
                maxLength={255}
                value={descripcion}
                onChange={(e) => { setDescripcion(e.target.value); clearFieldError("descripcion"); }}
              />
              <span style={{ fontSize: "11px", color: "#999", textAlign: "right" }}>
                {descripcion.length}/255
              </span>
              {errors.descripcion && <p style={errorTextStyle}>{errors.descripcion}</p>}
            </div>

            {/* Monto */}
            <div style={fieldStyle}>
              <label style={labelStyle} htmlFor="montoCobrado">Monto (₡)</label>
              <input
                style={inputStyle(!!errors.montoCobrado)}
                id="montoCobrado"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={montoCobrado}
                onChange={(e) => { setMontoCobrado(e.target.value); clearFieldError("montoCobrado"); }}
              />
              {errors.montoCobrado && <p style={errorTextStyle}>{errors.montoCobrado}</p>}
            </div>

            {serverMessage && (
              <p style={{ color: isSuccess ? "#276749" : "#c53030", fontSize: "13px", margin: 0 }}>
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
                alignSelf: "flex-start",
                minWidth: "140px",
              }}
            >
              {loading ? "Guardando..." : "Guardar servicio"}
            </button>
          </form>
        </section>

        {/* Historial */}
        <section style={{
          background: "#fff",
          borderRadius: "8px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          padding: "28px 32px",
        }}>
          <h2 style={{ fontSize: "16px", fontWeight: 600, margin: "0 0 16px" }}>Historial de servicios</h2>
          {historial.length === 0 ? (
            <p style={{ color: "#999", fontSize: "14px" }}>No hay servicios registrados.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #e2e8f0", textAlign: "left" }}>
                    <th style={{ padding: "8px 12px", color: "#555" }}>Fecha</th>
                    <th style={{ padding: "8px 12px", color: "#555" }}>Tipo</th>
                    <th style={{ padding: "8px 12px", color: "#555" }}>Descripción</th>
                    <th style={{ padding: "8px 12px", color: "#555", textAlign: "right" }}>Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {historial.map((s) => (
                    <tr key={s.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                      <td style={{ padding: "8px 12px", whiteSpace: "nowrap" }}>
                        {new Date(s.fecha).toLocaleDateString("es-CR")}
                      </td>
                      <td style={{ padding: "8px 12px", color: "#666" }}>
                        {s.tipoServicio || "—"}
                      </td>
                      <td style={{ padding: "8px 12px" }}>{s.nombreLibre}</td>
                      <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 600 }}>
                        ₡{s.monto.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

      </div>
    </main>
  );
}
