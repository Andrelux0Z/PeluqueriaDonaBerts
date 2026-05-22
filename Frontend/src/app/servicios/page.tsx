"use client";
import { useRouter } from "next/navigation";

export default function ServiciosPage() {
  const router = useRouter();

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
      <h1>Servicios</h1>
      <button
        onClick={() => router.push("/dashboard")}
        style={{
          padding: "8px 24px",
          borderRadius: "4px",
          border: "none",
          background: "#3182ce",
          color: "#fff",
          fontSize: "14px",
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Volver
      </button>
    </main>
  );
}