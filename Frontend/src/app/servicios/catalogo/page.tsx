"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../servicios.module.css";

const API = "http://localhost:5028/api/servicios/catalogo";

interface TipoServicioCatalogo {
  id: number;
  nombreServicio: string;
  descripcion: string;
  precioBase: number;
}

export default function CatalogoServiciosPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [catalogo, setCatalogo] = useState<TipoServicioCatalogo[]>([]);

  const fetchCatalogo = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(API);
      if (!res.ok) throw new Error("Error al cargar el catálogo");
      const data: TipoServicioCatalogo[] = await res.json();
      setCatalogo(data);
    } catch {
      setCatalogo([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const isAuthenticated = localStorage.getItem("isAuthenticated");
    if (!isAuthenticated) {
      router.push("/");
      return;
    }

    setAuthChecked(true);
  }, [router]);

  useEffect(() => {
    if (authChecked) {
      fetchCatalogo();
    }
  }, [authChecked, fetchCatalogo]);

  const fmtPrecio = (n: number) =>
    new Intl.NumberFormat("es-CR", { style: "currency", currency: "CRC" }).format(n);

  if (!authChecked) return null;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Catálogo de servicios</h1>
        <button
          id="btn-back"
          className={`${styles.btn} ${styles.btnSecondary}`}
          onClick={() => router.push("/servicios")}
        >
          ← Servicios
        </button>
      </div>

      <div className={styles.tableWrapper}>
        {loading ? (
          <div className={styles.loading}>Cargando catálogo...</div>
        ) : catalogo.length === 0 ? (
          <div className={styles.emptyState}>
            No hay servicios configurados. Sugiera crear uno desde la gestión de tipos.
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Servicio</th>
                <th>Descripción</th>
                <th>Monto base</th>
              </tr>
            </thead>
            <tbody>
              {catalogo.map((servicio) => (
                <tr key={servicio.id}>
                  <td>{servicio.nombreServicio}</td>
                  <td>{servicio.descripcion || servicio.nombreServicio}</td>
                  <td>{fmtPrecio(servicio.precioBase)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {!loading && catalogo.length > 0 && (
        <div className={styles.summary}>
          <span className={styles.summaryItem}>
            Servicios disponibles: <span className={styles.summaryValue}>{catalogo.length}</span>
          </span>
        </div>
      )}
    </div>
  );
}