"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import styles from "./historial.module.css";

const API = "http://localhost:5028/api/historial";

/* ─── Types ──────────────────────────────────── */
interface Transaccion {
  tipoTransaccion: string;
  idReferencia: number;
  fecha: string;
  monto: number;
  esAdquisicion: boolean;
}

type Filtro = "Todos" | "Compra" | "Venta" | "Servicio";

interface Toast {
  message: string;
  type: "error";
}

/* ─── Component ──────────────────────────────── */
export default function HistorialPage() {
  const router = useRouter();

  const [historial, setHistorial] = useState<Transaccion[]>([]);
  const [filtered, setFiltered] = useState<Transaccion[]>([]);
  const [filtro, setFiltro] = useState<Filtro>("Todos");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<Toast | null>(null);

  /* ─── Fetch ──────────────────────────────────── */
  const fetchHistorial = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(API);
      if (!res.ok) throw new Error();
      const data: Transaccion[] = await res.json();
      setHistorial(data);
    } catch {
      setToast({ message: "No se pudo cargar el historial. Verifique la conexión.", type: "error" });
      setHistorial([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistorial();
  }, [fetchHistorial]);

  /* ─── Filter ─────────────────────────────────── */
  useEffect(() => {
    let result = historial;

    if (filtro !== "Todos") {
      result = result.filter((t) => t.tipoTransaccion === filtro);
    }

    if (fechaInicio) {
      const start = new Date(fechaInicio);
      start.setHours(0, 0, 0, 0);
      result = result.filter((t) => new Date(t.fecha) >= start);
    }

    if (fechaFin) {
      const end = new Date(fechaFin);
      end.setHours(23, 59, 59, 999);
      result = result.filter((t) => new Date(t.fecha) <= end);
    }

    setFiltered(result);
  }, [filtro, fechaInicio, fechaFin, historial]);

  /* ─── Formatting ─────────────────────────────── */
  const fmtPrecio = (n: number) =>
    new Intl.NumberFormat("es-CR", { style: "currency", currency: "CRC" }).format(n);

  const fmtFecha = (f: string) =>
    new Date(f).toLocaleDateString("es-CR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const getBadgeClass = (tipo: string) => {
    switch (tipo) {
      case "Compra":   return styles.badgeCompra;
      case "Venta":    return styles.badgeVenta;
      case "Servicio": return styles.badgeServicio;
      default:         return "";
    }
  };

  /* ─── Derived data ───────────────────────────── */
  const totalIngresos = historial
    .filter((t) => !t.esAdquisicion)
    .reduce((sum, t) => sum + t.monto, 0);

  const totalEgresos = historial
    .filter((t) => t.esAdquisicion)
    .reduce((sum, t) => sum + t.monto, 0);

  const balance = totalIngresos - totalEgresos;

  const filtros: Filtro[] = ["Todos", "Compra", "Venta", "Servicio"];

  /* ─── Render ─────────────────────────────────── */
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Historial</h1>
        <button
          id="btn-back"
          className={`${styles.btn} ${styles.btnSecondary}`}
          onClick={() => router.push("/dashboard")}
        >
          ← Volver
        </button>
      </div>

      {toast && (
        <div className={`${styles.toast} ${styles.toastError}`}>
          {toast.message}
        </div>
      )}

      {/* Filter pills & dates */}
      <div className={styles.filters}>
        {filtros.map((f) => (
          <button
            key={f}
            className={`${styles.filterBtn} ${filtro === f ? styles.filterBtnActive : ""}`}
            onClick={() => setFiltro(f)}
          >
            {f}
          </button>
        ))}
        <div className={styles.filterDateGroup} style={{ marginLeft: "auto" }}>
          <label className={styles.filterDateLabel}>Desde:</label>
          <input
            type="date"
            className={styles.filterDate}
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
          />
        </div>
        <div className={styles.filterDateGroup}>
          <label className={styles.filterDateLabel}>Hasta:</label>
          <input
            type="date"
            className={styles.filterDate}
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className={styles.tableWrapper}>
        {loading ? (
          <div className={styles.loading}>Cargando historial...</div>
        ) : filtered.length === 0 ? (
          <div className={styles.emptyState}>
            {filtro !== "Todos"
              ? `No hay transacciones de tipo "${filtro}".`
              : "No hay transacciones registradas."}
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Ref.</th>
                <th>Fecha</th>
                <th style={{ textAlign: "right" }}>Monto</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t, i) => (
                <tr key={`${t.tipoTransaccion}-${t.idReferencia}-${i}`}>
                  <td>
                    <span className={`${styles.badge} ${getBadgeClass(t.tipoTransaccion)}`}>
                      {t.tipoTransaccion}
                    </span>
                  </td>
                  <td>#{t.idReferencia}</td>
                  <td>{fmtFecha(t.fecha)}</td>
                  <td style={{ textAlign: "right" }}>
                    <span className={t.esAdquisicion ? styles.montoOut : styles.montoIn}>
                      {t.esAdquisicion ? "−" : "+"} {fmtPrecio(t.monto)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Summary */}
      {!loading && historial.length > 0 && (
        <div className={styles.summary}>
          <span className={styles.summaryItem}>
            Transacciones: <span className={styles.summaryValue}>{historial.length}</span>
          </span>
          <span className={styles.summaryItem}>
            Ingresos: <span className={styles.montoIn}>{fmtPrecio(totalIngresos)}</span>
          </span>
          <span className={styles.summaryItem}>
            Egresos: <span className={styles.montoOut}>{fmtPrecio(totalEgresos)}</span>
          </span>
          <span className={styles.summaryItem}>
            Balance: <span className={styles.summaryValue}>{fmtPrecio(balance)}</span>
          </span>
        </div>
      )}
    </div>
  );
}