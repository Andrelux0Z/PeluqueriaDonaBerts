"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import styles from "./servicios.module.css";

const API = "http://localhost:5028/api/servicios";

/* ─── Types ──────────────────────────────────── */
interface Servicio {
  id: number;
  nombre: string;
  fecha: string;
  monto: number;
}

interface TipoServicio {
  id: number;
  nombre: string;
  precio: number;
}

interface Toast {
  message: string;
  type: "success" | "error";
}

const emptyForm = { idTipoServicio: null as number | null, nombreLibre: "", monto: 0 };

/* ─── Component ──────────────────────────────── */
export default function ServiciosPage() {
  const router = useRouter();

    const [authChecked, setAuthChecked] = useState(false);

  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [filtered, setFiltered] = useState<Servicio[]>([]);
  const [tipos, setTipos] = useState<TipoServicio[]>([]);
  const [search, setSearch] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<Toast | null>(null);

  /* Modal */
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [usarNombreLibre, setUsarNombreLibre] = useState(false);
  const [saving, setSaving] = useState(false);

  /* Delete */
  const [confirmDelete, setConfirmDelete] = useState<Servicio | null>(null);

  /* ─── Fetch ──────────────────────────────────── */
  const fetchServicios = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(API);
      if (!res.ok) throw new Error();
      const rawData = await res.json();
      
      // Mapeamos los datos para adaptarnos a las estructuras de ambos desarrolladores
      const data: Servicio[] = rawData.map((d: any) => ({
        id: d.id,
        nombre: d.tipoServicio || d.nombreLibre,
        fecha: d.fecha,
        monto: d.monto,
      }));

      setServicios(data);
      setFiltered(data);
    } catch {
      showToast("No se pudieron cargar los servicios. Verifique la conexión.", "error");
      setServicios([]);
      setFiltered([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTipos = useCallback(async () => {
    try {
      const res = await fetch(`${API}/configuraciones`);
      if (!res.ok) throw new Error();
      const rawTipos = await res.json();
      
      setTipos(rawTipos.map((t: any) => ({
        id: t.id,
        nombre: t.nombreServicio,
        precio: t.precioBase
      })));
    } catch {}
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
      fetchServicios();
      fetchTipos();
    }
  }, [authChecked, fetchServicios, fetchTipos]);

  /* ─── Search & Filter ────────────────────────── */
  useEffect(() => {
    let result = servicios;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((s) => s.nombre.toLowerCase().includes(q));
    }

    if (fechaInicio) {
      const start = new Date(fechaInicio);
      // Ajustar zona horaria si es necesario, o comparar directamente
      start.setHours(0, 0, 0, 0);
      result = result.filter((s) => new Date(s.fecha) >= start);
    }

    if (fechaFin) {
      const end = new Date(fechaFin);
      end.setHours(23, 59, 59, 999);
      result = result.filter((s) => new Date(s.fecha) <= end);
    }

    setFiltered(result);
  }, [search, fechaInicio, fechaFin, servicios]);

  /* ─── Toast ──────────────────────────────────── */
  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  /* ─── Modal ──────────────────────────────────── */
  const openCreate = () => {
    setForm(emptyForm);
    setUsarNombreLibre(false);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setForm(emptyForm);
    setUsarNombreLibre(false);
  };

  /* When selecting a tipo, auto-fill monto */
  const handleTipoChange = (idStr: string) => {
    if (idStr === "") {
      setForm({ ...form, idTipoServicio: null, monto: 0 });
      return;
    }
    const id = Number(idStr);
    const tipo = tipos.find((t) => t.id === id);
    setForm({
      ...form,
      idTipoServicio: id,
      monto: tipo?.precio ?? 0,
    });
  };

  /* ─── Save ───────────────────────────────────── */
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.monto <= 0) return;

    setSaving(true);
    try {
      const idUsuario = parseInt(localStorage.getItem("idUsuario") || "1");
      const descripcionDefault = tipos.find((t) => t.id === form.idTipoServicio)?.nombre || "Servicio genérico";

      const body = {
        fecha: new Date().toISOString(),
        descripcion: usarNombreLibre ? form.nombreLibre : descripcionDefault,
        montoCobrado: form.monto,
        idConfiguracion: usarNombreLibre ? null : form.idTipoServicio,
        idPostByUser: idUsuario
      };

      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message || "Error al registrar");
      }

      showToast("Servicio registrado correctamente.", "success");
      closeModal();
      fetchServicios();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error inesperado";
      showToast(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  /* ─── Delete ─────────────────────────────────── */
  const handleDelete = async () => {
    if (!confirmDelete) return;

    try {
      const res = await fetch(`${API}/${confirmDelete.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();

      showToast("Servicio eliminado correctamente.", "success");
      setConfirmDelete(null);
      fetchServicios();
    } catch {
      showToast("No se pudo eliminar el servicio.", "error");
    }
  };

  /* ─── Derived ────────────────────────────────── */
  const totalServicios = servicios.length;
  const totalMonto = servicios.reduce((sum, s) => sum + s.monto, 0);

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

  if (!authChecked) return null;

  /* ─── Render ─────────────────────────────────── */
  return (

    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Servicios</h1>
        <div className={styles.headerActions}>
          <button
            id="btn-back"
            className={`${styles.btn} ${styles.btnSecondary}`}
            onClick={() => router.push("/dashboard")}
          >
            ← Volver
          </button>
          <button
            id="btn-add"
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={openCreate}
          >
            + Registrar
          </button>
        </div>
      </div>

      {toast && (
        <div
          className={`${styles.toast} ${
            toast.type === "success" ? styles.toastSuccess : styles.toastError
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className={styles.filtersRow}>
        <input
          id="search-servicios"
          className={styles.filterInput}
          type="text"
          placeholder="Buscar servicio por nombre..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className={styles.filterDateGroup}>
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

      <div className={styles.tableWrapper}>
        {loading ? (
          <div className={styles.loading}>Cargando servicios...</div>
        ) : filtered.length === 0 ? (
          <div className={styles.emptyState}>
            {search ? "No se encontraron resultados." : "No hay servicios registrados."}
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Servicio</th>
                <th>Fecha</th>
                <th>Monto</th>
                <th style={{ textAlign: "right" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id}>
                  <td>{s.nombre}</td>
                  <td>{fmtFecha(s.fecha)}</td>
                  <td>{fmtPrecio(s.monto)}</td>
                  <td>
                    <div className={styles.tdActions}>
                      <button
                        className={`${styles.btn} ${styles.btnDanger} ${styles.btnSmall}`}
                        onClick={() => setConfirmDelete(s)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {!loading && servicios.length > 0 && (
        <div className={styles.summary}>
          <span className={styles.summaryItem}>
            Servicios: <span className={styles.summaryValue}>{totalServicios}</span>
          </span>
          <span className={styles.summaryItem}>
            Total facturado: <span className={styles.summaryValue}>{fmtPrecio(totalMonto)}</span>
          </span>
        </div>
      )}

      {/* ── Create modal ─────────────────────────── */}
      {showModal && (
        <div className={styles.overlay} onClick={closeModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Registrar servicio</h2>

            <form className={styles.form} onSubmit={handleSave}>
              {/* Toggle: tipo preestablecido vs nombre libre */}
              <div className={styles.field}>
                <label className={styles.label}>
                  <input
                    type="checkbox"
                    checked={usarNombreLibre}
                    onChange={(e) => {
                      setUsarNombreLibre(e.target.checked);
                      setForm({ ...form, idTipoServicio: null, nombreLibre: "" });
                    }}
                    style={{ marginRight: 6 }}
                  />
                  Usar nombre personalizado
                </label>
              </div>

              {usarNombreLibre ? (
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="inp-nombre-libre">
                    Nombre del servicio
                  </label>
                  <input
                    id="inp-nombre-libre"
                    className={styles.input}
                    type="text"
                    placeholder="Ej: Trenzas africanas"
                    value={form.nombreLibre}
                    onChange={(e) => setForm({ ...form, nombreLibre: e.target.value })}
                    required
                    autoFocus
                  />
                </div>
              ) : (
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="inp-tipo">
                    Tipo de servicio
                  </label>
                  <select
                    id="inp-tipo"
                    className={styles.select}
                    value={form.idTipoServicio ?? ""}
                    onChange={(e) => handleTipoChange(e.target.value)}
                    required
                  >
                    <option value="">Seleccionar...</option>
                    {tipos.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nombre} — {fmtPrecio(t.precio)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className={styles.field}>
                <label className={styles.label} htmlFor="inp-monto">
                  Monto (₡)
                </label>
                <input
                  id="inp-monto"
                  className={styles.input}
                  type="number"
                  min={0}
                  step={0.01}
                  value={form.monto}
                  onChange={(e) => setForm({ ...form, monto: Number(e.target.value) })}
                  required
                />
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnSecondary}`}
                  onClick={closeModal}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`${styles.btn} ${styles.btnPrimary}`}
                  disabled={saving}
                >
                  {saving ? "Guardando..." : "Registrar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete confirm ───────────────────────── */}
      {confirmDelete && (
        <div className={styles.overlay} onClick={() => setConfirmDelete(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Confirmar eliminación</h2>
            <p className={styles.confirmText}>
              ¿Está seguro que desea eliminar el servicio{" "}
              <span className={styles.confirmName}>{confirmDelete.nombre}</span>?
            </p>
            <div className={styles.modalActions}>
              <button
                className={`${styles.btn} ${styles.btnSecondary}`}
                onClick={() => setConfirmDelete(null)}
              >
                Cancelar
              </button>
              <button
                className={`${styles.btn} ${styles.btnDanger}`}
                onClick={handleDelete}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}