"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./dashboard.module.css";

const BACKEND_URL = "http://localhost:5028";

export default function Dashboard() {
  const [username, setUsername] = useState("");
  const [rol, setRol] = useState("");
  const router = useRouter();

  useEffect(() => {
    const isAuthenticated = localStorage.getItem("isAuthenticated");
    if (!isAuthenticated) {
      router.push("/");
      return;
    }
    setUsername(localStorage.getItem("username") ?? "");
    setRol(localStorage.getItem("rol") ?? "");
  }, [router]);

  const handleLogout = async () => {
    const idUsuario = parseInt(localStorage.getItem("idUsuario") ?? "0");
    try {
      await fetch(`http://localhost:5028/api/login/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idUsuario }),
      });
    } catch {}
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("idUsuario");
    localStorage.removeItem("username");
    localStorage.removeItem("rol");
    router.push("/");
  };

  const rolLabel: Record<string, string> = {
    Admin: "Admin Principal",
    Empleado: "Admin Alto Rango",
    EmpleadoBasico: "Empleado Básico",
  };

  const navItems = [
    { title: "Inventario", desc: "Productos, stock y precios", path: "/productos" },
    { title: "Servicios", desc: "Registro de servicios prestados", path: "/servicios" },
    { title: "Historial", desc: "Compras, ventas y servicios", path: "/historial" },
  ];

  if (rol === "Admin") {
    navItems.push({
      title: "Gestión de Usuarios",
      desc: "Creación y control de cuentas de acceso",
      path: "/dashboard/users"
    });
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Bienvenido, {username}</h1>
        {rol && <p style={{ color: "#6a6a6a", fontSize: 14, marginTop: 4 }}>{rolLabel[rol] ?? rol}</p>}
      </div>

      <nav className={styles.nav}>
        {navItems.map((item) => (
          <div
            key={item.path}
            className={styles.navItem}
            onClick={() => router.push(item.path)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && router.push(item.path)}
          >
            <div>
              {item.title}
              <div className={styles.navDesc}>{item.desc}</div>
            </div>
            <span className={styles.navArrow}>→</span>
          </div>
        ))}
      </nav>

      <div className={styles.footer}>
        <button
          id="btn-logout"
          className={styles.logout}
          onClick={handleLogout}
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
