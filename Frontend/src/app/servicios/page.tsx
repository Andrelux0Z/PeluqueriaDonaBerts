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
  const [draftSearch, setDraftSearch] = useState("");
  const [draftFechaInicio, setDraftFechaInicio] = useState("");
  const [draftFechaFin, setDraftFechaFin] = useState("");
  const [draftMontoMin, setDraftMontoMin] = useState("");
  const [draftMontoMax, setDraftMontoMax] = useState("");
  const [filterError, setFilterError] = useState("");

  const [appliedFilters, setAppliedFilters] = useState({
    search: "",
    fechaInicio: "",
    fechaFin: "",
    montoMin: "",
    montoMax: ""
  });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<Toast | null>(null);

  /* Modal */
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [usarNombreLibre, setUsarNombreLibre] = useState(false);
  const [saving, setSaving] = useState(false);

  /* Delete */
  const [confirmDelete, setConfirmDelete] = useState<Servicio | null>(null);

  /* Nuevo tipo (SV-002) */
  const [showModalNuevoTipo, setShowModalNuevoTipo] = useState(false);
  const [formNuevoTipo, setFormNuevoTipo] = useState({ nombre: "", precio: 0 });
  const [savingNuevoTipo, setSavingNuevoTipo] = useState(false);

  /* Gestión tipos (SV-004) */
  const [showGestion, setShowGestion] = useState(false);
  const [tipoAEditar, setTipoAEditar] = useState<TipoServicio | null>(null);
  const [formEditar, setFormEditar] = useState({ nombre: "", precio: 0 });
  const [savingEditar, setSavingEditar] = useState(false);
  const [tipoAEliminar, setTipoAEliminar] = useState<TipoServicio | null>(null);

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
  const validateAndApplyFilters = () => {
    setFilterError("");

    if (draftFechaInicio && draftFechaFin) {
      if (new Date(draftFechaInicio) > new Date(draftFechaFin)) {
        setFilterError("La fecha 'Desde' no puede ser mayor a la fecha 'Hasta'.");
        return;
      }
    }

    if (draftMontoMin && draftMontoMax) {
      if (Number(draftMontoMin) > Number(draftMontoMax)) {
        setFilterError("El monto mínimo no puede ser mayor al monto máximo.");
        return;
      }
    }

    setAppliedFilters({
      search: draftSearch,
      fechaInicio: draftFechaInicio,
      fechaFin: draftFechaFin,
      montoMin: draftMontoMin,
      montoMax: draftMontoMax
    });
  };

  const clearFilters = () => {
    setDraftSearch("");
    setDraftFechaInicio("");
    setDraftFechaFin("");
    setDraftMontoMin("");
    setDraftMontoMax("");
    setFilterError("");
    setAppliedFilters({
      search: "",
      fechaInicio: "",
      fechaFin: "",
      montoMin: "",
      montoMax: ""
    });
  };

  useEffect(() => {
    let result = servicios;

    if (appliedFilters.search.trim()) {
      const q = appliedFilters.search.toLowerCase();
      result = result.filter((s) => s.nombre.toLowerCase().includes(q));
    }

    if (appliedFilters.fechaInicio) {
      const start = new Date(appliedFilters.fechaInicio);
      start.setHours(0, 0, 0, 0);
      result = result.filter((s) => new Date(s.fecha) >= start);
    }

    if (appliedFilters.fechaFin) {
      const end = new Date(appliedFilters.fechaFin);
      end.setHours(23, 59, 59, 999);
      result = result.filter((s) => new Date(s.fecha) <= end);
    }

    if (appliedFilters.montoMin) {
      result = result.filter((s) => s.monto >= Number(appliedFilters.montoMin));
    }

    if (appliedFilters.montoMax) {
      result = result.filter((s) => s.monto <= Number(appliedFilters.montoMax));
    }

    setFiltered(result);
  }, [appliedFilters, servicios]);

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

  /* ─── Crear tipo (SV-002) ───────────────────── */
  const openNuevoTipo = () => {
    setFormNuevoTipo({ nombre: "", precio: 0 });
    setShowModalNuevoTipo(true);
  };

  const closeNuevoTipo = () => {
    setShowModalNuevoTipo(false);
    setFormNuevoTipo({ nombre: "", precio: 0 });
  };

  const handleCrearTipo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNuevoTipo.nombre.trim()) return;

    setSavingNuevoTipo(true);
    try {
      const res = await fetch(`${API}/configuraciones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombreServicio: formNuevoTipo.nombre.trim(),
          precioBase: formNuevoTipo.precio,
        }),
      });

      const data = await res.json().catch(() => null);

      if (res.status === 409) throw new Error("Ya existe un tipo de servicio con ese nombre.");
      if (!res.ok) throw new Error(data?.message || "Error al crear el tipo de servicio.");

      await fetchTipos();
      setForm((prev) => ({ ...prev, idTipoServicio: data.id, monto: formNuevoTipo.precio }));
      closeNuevoTipo();
      showToast(`Tipo "${formNuevoTipo.nombre.trim()}" creado y seleccionado.`, "success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error inesperado";
      showToast(msg, "error");
    } finally {
      setSavingNuevoTipo(false);
    }
  };

  /* ─── Gestión tipos (SV-004) ────────────────── */
  const openEditar = (tipo: TipoServicio) => {
    setFormEditar({ nombre: tipo.nombre, precio: tipo.precio });
    setTipoAEditar(tipo);
  };

  const closeEditar = () => {
    setTipoAEditar(null);
    setFormEditar({ nombre: "", precio: 0 });
  };

  const handleActualizarTipo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tipoAEditar || !formEditar.nombre.trim()) return;

    setSavingEditar(true);
    try {
      const res = await fetch(`${API}/configuraciones/${tipoAEditar.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombreServicio: formEditar.nombre.trim(),
          precioBase: formEditar.precio,
        }),
      });

      const data = await res.json().catch(() => null);
      if (res.status === 409) throw new Error("Ya existe un tipo de servicio con ese nombre.");
      if (res.status === 404) throw new Error("El tipo de servicio no existe o fue eliminado.");
      if (!res.ok) throw new Error(data?.message || "Error al actualizar.");

      await fetchTipos();
      closeEditar();
      showToast("Tipo de servicio actualizado correctamente.", "success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error inesperado";
      showToast(msg, "error");
    } finally {
      setSavingEditar(false);
    }
  };

  const handleEliminarTipo = async () => {
    if (!tipoAEliminar) return;

    try {
      const res = await fetch(`${API}/configuraciones/${tipoAEliminar.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => null);
      if (res.status === 404) throw new Error("El tipo de servicio no existe o ya fue eliminado.");
      if (!res.ok) throw new Error(data?.message || "Error al eliminar.");

      await fetchTipos();
      setTipoAEliminar(null);
      showToast("Tipo de servicio eliminado correctamente.", "success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error inesperado";
      showToast(msg, "error");
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
            className={`${styles.btn} ${styles.btnSecondary}`}
            onClick={() => router.push("/servicios/catalogo")}
          >
            Catálogo
          </button>
          <button
            className={`${styles.btn} ${styles.btnSecondary}`}
            onClick={() => setShowGestion(true)}
          >
            Gestionar tipos
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

      <div className={styles.filtersGrid}>
        {/* Fila 1 */}
        <input
          id="search-servicios"
          className={styles.filterInput}
          type="text"
          placeholder="Buscar servicio por nombre..."
          value={draftSearch}
          onChange={(e) => setDraftSearch(e.target.value)}
        />
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Desde:</label>
          <input
            type="date"
            className={styles.filterControl}
            value={draftFechaInicio}
            onChange={(e) => setDraftFechaInicio(e.target.value)}
          />
        </div>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Hasta:</label>
          <input
            type="date"
            className={styles.filterControl}
            value={draftFechaFin}
            onChange={(e) => setDraftFechaFin(e.target.value)}
          />
        </div>

        {/* Fila 2 */}
        <div className={styles.filtersActions}>
          <button
            className={`${styles.btn} ${styles.btnSecondary}`}
            onClick={clearFilters}
          >
            Limpiar
          </button>
          <button
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={validateAndApplyFilters}
          >
            Filtrar
          </button>
        </div>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Mín ₡:</label>
          <input
            type="number"
            min={0}
            className={styles.filterControl}
            value={draftMontoMin}
            onChange={(e) => setDraftMontoMin(e.target.value)}
            placeholder="0"
          />
        </div>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Máx ₡:</label>
          <input
            type="number"
            min={0}
            className={styles.filterControl}
            value={draftMontoMax}
            onChange={(e) => setDraftMontoMax(e.target.value)}
            placeholder="∞"
          />
        </div>
      </div>

      {filterError && (
        <div className={styles.filterErrorText}>{filterError}</div>
      )}

      <div className={styles.tableWrapper}>
        {loading ? (
          <div className={styles.loading}>Cargando servicios...</div>
        ) : filtered.length === 0 ? (
          <div className={styles.emptyState}>
            {Object.values(appliedFilters).some(v => v !== "") ? "No se encontraron resultados." : "No hay servicios registrados."}
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
                  <button
                    type="button"
                    className={styles.btnLink}
                    onClick={openNuevoTipo}
                  >
                    + Crear nuevo tipo
                  </button>
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

      {/* ── Nuevo tipo modal (SV-002) ───────────── */}
      {showModalNuevoTipo && (
        <div className={styles.overlayNested} onClick={closeNuevoTipo}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Crear tipo de servicio</h2>

            <form className={styles.form} onSubmit={handleCrearTipo}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="inp-tipo-nombre">
                  Nombre del tipo
                </label>
                <input
                  id="inp-tipo-nombre"
                  className={styles.input}
                  type="text"
                  placeholder="Ej: Tintura completa"
                  value={formNuevoTipo.nombre}
                  onChange={(e) => setFormNuevoTipo({ ...formNuevoTipo, nombre: e.target.value })}
                  required
                  autoFocus
                  maxLength={100}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="inp-tipo-precio">
                  Precio base (₡)
                </label>
                <input
                  id="inp-tipo-precio"
                  className={styles.input}
                  type="number"
                  min={0}
                  step={0.01}
                  value={formNuevoTipo.precio}
                  onChange={(e) => setFormNuevoTipo({ ...formNuevoTipo, precio: Number(e.target.value) })}
                  required
                />
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnSecondary}`}
                  onClick={closeNuevoTipo}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`${styles.btn} ${styles.btnPrimary}`}
                  disabled={savingNuevoTipo}
                >
                  {savingNuevoTipo ? "Guardando..." : "Crear tipo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Gestión de tipos (SV-004) ───────────── */}
      {showGestion && (
        <div className={styles.overlay} onClick={() => setShowGestion(false)}>
          <div className={styles.modalWide} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Gestionar tipos de servicio</h2>
              <button
                type="button"
                className={styles.btnClose}
                onClick={() => setShowGestion(false)}
              >
                ×
              </button>
            </div>

            {tipos.length === 0 ? (
              <p className={styles.emptyState}>No hay tipos de servicio registrados.</p>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Precio base</th>
                    <th style={{ textAlign: "right" }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {tipos.map((t) => (
                    <tr key={t.id}>
                      <td>{t.nombre}</td>
                      <td>{fmtPrecio(t.precio)}</td>
                      <td>
                        <div className={styles.tdActions}>
                          <button
                            className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSmall}`}
                            onClick={() => openEditar(t)}
                          >
                            Editar
                          </button>
                          <button
                            className={`${styles.btn} ${styles.btnDanger} ${styles.btnSmall}`}
                            onClick={() => setTipoAEliminar(t)}
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
        </div>
      )}

      {/* ── Editar tipo (SV-004) ─────────────────── */}
      {tipoAEditar && (
        <div className={styles.overlayNested} onClick={closeEditar}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Editar tipo de servicio</h2>

            <form className={styles.form} onSubmit={handleActualizarTipo}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="inp-edit-nombre">Nombre</label>
                <input
                  id="inp-edit-nombre"
                  className={styles.input}
                  type="text"
                  value={formEditar.nombre}
                  onChange={(e) => setFormEditar({ ...formEditar, nombre: e.target.value })}
                  required
                  autoFocus
                  maxLength={100}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="inp-edit-precio">Precio base (₡)</label>
                <input
                  id="inp-edit-precio"
                  className={styles.input}
                  type="number"
                  min={0}
                  step={0.01}
                  value={formEditar.precio}
                  onChange={(e) => setFormEditar({ ...formEditar, precio: Number(e.target.value) })}
                  required
                />
              </div>
              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnSecondary}`}
                  onClick={closeEditar}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`${styles.btn} ${styles.btnPrimary}`}
                  disabled={savingEditar}
                >
                  {savingEditar ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Confirmar eliminar tipo (SV-004) ────── */}
      {tipoAEliminar && (
        <div className={styles.overlayNested} onClick={() => setTipoAEliminar(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Eliminar tipo de servicio</h2>
            <p className={styles.confirmText}>
              ¿Está seguro que desea eliminar el tipo{" "}
              <span className={styles.confirmName}>{tipoAEliminar.nombre}</span>?
            </p>
            <p className={styles.confirmNote}>
              Los servicios ya registrados con este tipo no se verán afectados.
            </p>
            <div className={styles.modalActions}>
              <button
                className={`${styles.btn} ${styles.btnSecondary}`}
                onClick={() => setTipoAEliminar(null)}
              >
                Cancelar
              </button>
              <button
                className={`${styles.btn} ${styles.btnDanger}`}
                onClick={handleEliminarTipo}
              >
                Eliminar
              </button>
            </div>
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