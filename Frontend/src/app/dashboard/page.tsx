"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const BACKEND_URL = "http://localhost:5149";

export default function Dashboard() {
  const [username, setUsername] = useState("");
  const [rol, setRol] = useState("");
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/");
      return;
    }
    setUsername(localStorage.getItem("username") ?? "");
    setRol(localStorage.getItem("rol") ?? "");
  }, [router]);

  const handleLogout = async () => {
    const token = localStorage.getItem("token");
    try {
      await fetch(`${BACKEND_URL}/api/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {}
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("rol");
    router.push("/");
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
      gap: "12px",
    }}>
      <h1 style={{ fontSize: "24px", fontWeight: 600 }}>
        Dashboard - Bienvenido, {username}
      </h1>
      <p style={{ color: "#6a6a6a", fontSize: "14px", marginBottom: "20px" }}>Rol: {rol}</p>
      
      <div style={{ display: "flex", gap: "16px", marginBottom: "32px" }}>
        <button
          onClick={() => router.push("/productos")}
          style={{
            padding: "12px 24px",
            borderRadius: "4px",
            border: "none",
            background: "#3182ce",
            color: "#fff",
            fontSize: "16px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Productos
        </button>
        <button
          onClick={() => router.push("/servicios")}
          style={{
            padding: "12px 24px",
            borderRadius: "4px",
            border: "none",
            background: "#3182ce",
            color: "#fff",
            fontSize: "16px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Servicios
        </button>
        <button
          onClick={() => router.push("/historial")}
          style={{
            padding: "12px 24px",
            borderRadius: "4px",
            border: "none",
            background: "#3182ce",
            color: "#fff",
            fontSize: "16px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Historial completo
        </button>
      </div>

      <button
        onClick={handleLogout}
        style={{
          marginTop: "8px",
          padding: "8px 24px",
          borderRadius: "4px",
          border: "none",
          background: "#c53030",
          color: "#fff",
          fontSize: "14px",
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Cerrar sesión
      </button>
    </main>
  );
}
