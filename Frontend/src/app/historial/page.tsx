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
  detalle: string;
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
  const [montoMin, setMontoMin] = useState("");
  const [montoMax, setMontoMax] = useState("");
  const [detalle, setDetalle] = useState("");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<Toast | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const isAuthenticated = localStorage.getItem("isAuthenticated");
    if (!isAuthenticated) {
      router.push("/");
      return;
    }

    setAuthChecked(true);
  }, [router]);

  /* ─── Fetch ──────────────────────────────────── */
  const fetchAll = useCallback(async () => {
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

  const fetchFiltered = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();

      if (filtro !== "Todos") params.set("TipoTransaccion", filtro);
      if (fechaInicio) params.set("FechaInicio", fechaInicio);
      if (fechaFin) params.set("FechaFin", fechaFin);
      if (montoMin.trim()) params.set("MontoMin", montoMin.trim());
      if (montoMax.trim()) params.set("MontoMax", montoMax.trim());
      if (detalle.trim()) params.set("Detalle", detalle.trim());

      const query = params.toString();
      const res = await fetch(`${API}/filtrar?${query}`);
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message || "Error al aplicar filtros");
      }

      const data = await res.json();
      if (Array.isArray(data)) {
        setHistorial(data);
      } else if (data.historial) {
        setHistorial(data.historial);
      } else {
        setHistorial([]);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error inesperado";
      setToast({ message: msg, type: "error" });
      setHistorial([]);
    } finally {
      setLoading(false);
    }
  }, [filtro, fechaInicio, fechaFin, montoMin, montoMax, detalle]);

  useEffect(() => {
    if (authChecked) fetchAll();
  }, [authChecked, fetchAll]);

  /* ─── Filter ─────────────────────────────────── */
  useEffect(() => {
    setFiltered(historial);
  }, [historial]);

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
  const hasActiveFilters =
    filtro !== "Todos" ||
    Boolean(fechaInicio) ||
    Boolean(fechaFin) ||
    Boolean(montoMin) ||
    Boolean(montoMax) ||
    Boolean(detalle.trim());

  /* ─── Actions ────────────────────────────────── */
  const aplicarFiltros = async () => {
    if (!hasActiveFilters) {
      await fetchAll();
      return;
    }

    await fetchFiltered();
  };

  const limpiarFiltros = async () => {
    setFiltro("Todos");
    setFechaInicio("");
    setFechaFin("");
    setMontoMin("");
    setMontoMax("");
    setDetalle("");
    await fetchAll();
  };

  if (!authChecked) {
    return null;
  }

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
        <div className={styles.filterDateGroup}>
          <label className={styles.filterDateLabel}>Monto mín.:</label>
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            className={styles.filterDate}
            value={montoMin}
            onChange={(e) => setMontoMin(e.target.value)}
          />
        </div>
        <div className={styles.filterDateGroup}>
          <label className={styles.filterDateLabel}>Monto máx.:</label>
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            className={styles.filterDate}
            value={montoMax}
            onChange={(e) => setMontoMax(e.target.value)}
          />
        </div>
        <div className={styles.filterDateGroup}>
          <label className={styles.filterDateLabel}>Detalle:</label>
          <input
            type="text"
            className={`${styles.filterDate} ${styles.filterText}`}
            value={detalle}
            placeholder="Nombre de producto o servicio"
            onChange={(e) => setDetalle(e.target.value)}
          />
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={aplicarFiltros}>
            Aplicar filtros
          </button>
          <button
            className={`${styles.btn} ${styles.btnSecondary}`}
            onClick={limpiarFiltros}
            disabled={!hasActiveFilters}
          >
            Limpiar filtros
          </button>
        </div>
      </div>

      {/* Table */}
      <div className={styles.tableWrapper}>
        {loading ? (
          <div className={styles.loading}>Cargando historial...</div>
        ) : filtered.length === 0 ? (
          <div className={styles.emptyState}>
            {hasActiveFilters
              ? "No hay transacciones que coincidan con los filtros aplicados."
              : "No hay transacciones registradas."}
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Ref.</th>
                <th>Detalle</th>
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
                  <td>{t.detalle || "—"}</td>
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