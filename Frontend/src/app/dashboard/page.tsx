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
        Bienvenido, {username}
      </h1>
      <p style={{ color: "#6a6a6a", fontSize: "14px" }}>Rol: {rol}</p>
      {rol === "Admin" && (
        <button
          onClick={() => router.push("/dashboard/users")}
          style={{
            padding: "8px 24px",
            borderRadius: "4px",
            border: "none",
            background: "#2a4a7f",
            color: "#fff",
            fontSize: "14px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Gestión de Usuarios
        </button>
      )}
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
