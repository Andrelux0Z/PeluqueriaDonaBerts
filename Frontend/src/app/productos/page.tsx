"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import styles from "./productos.module.css";

const API = "http://localhost:5028/api/productos";

/* ─── Types ──────────────────────────────────── */
interface Producto {
  id: number;
  codigo: string;
  nombre: string;
  cantidad: number;
  precio: number;
  stockMinimo: number;
}

interface Toast {
  message: string;
  type: "success" | "error";
}

const emptyForm = { nombre: "", cantidad: 0, precio: 0, stockMinimo: 5 };

/* ─── Component ──────────────────────────────── */
export default function ProductosPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [filtered, setFiltered] = useState<Producto[]>([]);
  const [search, setSearch] = useState("");
  const [codigo, setCodigo] = useState("");
  const [precioMin, setPrecioMin] = useState("");
  const [precioMax, setPrecioMax] = useState("");
  const [cantidadMin, setCantidadMin] = useState("");
  const [cantidadMax, setCantidadMax] = useState("");
  const [hasActiveFilters, setHasActiveFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<Toast | null>(null);

  /* Modal state */
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  /* Delete confirm */
  const [confirmDelete, setConfirmDelete] = useState<Producto | null>(null);

  /* Registrar compra (IP-006) */
  const [showModalCompra, setShowModalCompra] = useState(false);
  const [formCompra, setFormCompra] = useState({
    idProducto: null as number | null,
    cantidad: 1,
    precioUnit: 0,
    aplicarDescuento: false,
    descuento: 0,
    notas: "",
  });
  const [savingCompra, setSavingCompra] = useState(false);

  /* ─── Data fetching ──────────────────────────── */
  const fetchProductos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(API);
      if (!res.ok) throw new Error("Error al obtener productos");
      const data: Producto[] = await res.json();
      setProductos(data);
      setFiltered(data);
    } catch {
      showToast("No se pudieron cargar los productos. Verifique la conexión.", "error");
      setProductos([]);
      setFiltered([]);
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
    if (authChecked) fetchProductos();
  }, [authChecked, fetchProductos]);

  const limpiarFiltros = () => {
    setSearch("");
    setCodigo("");
    setPrecioMin("");
    setPrecioMax("");
    setCantidadMin("");
    setCantidadMax("");
    setHasActiveFilters(false);
    setFiltered(productos);
  };

  const aplicarFiltros = async () => {
    const nombre = search.trim();
    const cod = codigo.trim();
    const pMin = precioMin.trim();
    const pMax = precioMax.trim();
    const cMin = cantidadMin.trim();
    const cMax = cantidadMax.trim();

    if (!nombre && !cod && !pMin && !pMax && !cMin && !cMax) {
      showToast("Debe ingresar al menos un criterio de búsqueda.", "error");
      return;
    }

    if (pMin && pMax && Number(pMin) > Number(pMax)) {
      showToast("El rango de precio es inválido.", "error");
      return;
    }

    if (cMin && cMax && Number(cMin) > Number(cMax)) {
      showToast("El rango de cantidad es inválido.", "error");
      return;
    }

    const params = new URLSearchParams();
    if (nombre) params.set("Nombre", nombre);
    if (cod) params.set("Codigo", cod);
    if (pMin) params.set("PrecioMin", pMin);
    if (pMax) params.set("PrecioMax", pMax);
    if (cMin) params.set("CantidadMin", cMin);
    if (cMax) params.set("CantidadMax", cMax);

    setLoading(true);
    try {
      const res = await fetch(`${API}/filtrar?${params.toString()}`);
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.message || "No se pudieron aplicar los filtros");
      }

      if (Array.isArray(data)) {
        setFiltered(data);
      } else {
        setFiltered(data?.productos ?? []);
      }

      setHasActiveFilters(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error inesperado";
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  /* ─── Toast ──────────────────────────────────── */
  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  /* ─── Modal helpers ──────────────────────────── */
  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (p: Producto) => {
    setEditingId(p.id);
    setForm({
      nombre: p.nombre,
      cantidad: p.cantidad,
      precio: p.precio,
      stockMinimo: p.stockMinimo,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  /* ─── Save (create / update) ─────────────────── */
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre.trim()) return;

    setSaving(true);
    try {
      const isEdit = editingId !== null;
      const url = isEdit ? `${API}/${editingId}` : API;
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message || "Error en la operación");
      }

      showToast(
        isEdit ? "Producto actualizado correctamente." : "Producto creado correctamente.",
        "success"
      );
      closeModal();
      fetchProductos();
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
      if (!res.ok) throw new Error("Error al eliminar");

      showToast("Producto eliminado correctamente.", "success");
      setConfirmDelete(null);
      fetchProductos();
    } catch {
      showToast("No se pudo eliminar el producto.", "error");
    }
  };

  /* ─── Compra handlers (IP-006) ──────────────── */
  const openCompra = () => {
    setFormCompra({ idProducto: null, cantidad: 1, precioUnit: 0, aplicarDescuento: false, descuento: 0, notas: "" });
    setShowModalCompra(true);
  };

  const closeCompra = () => setShowModalCompra(false);

  const handleRegistrarCompra = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCompra.idProducto) { showToast("Debe seleccionar un producto.", "error"); return; }
    if (formCompra.cantidad <= 0) { showToast("La cantidad debe ser mayor a cero.", "error"); return; }
    if (formCompra.precioUnit < 0) { showToast("El precio unitario no puede ser negativo.", "error"); return; }
    if (formCompra.aplicarDescuento && (formCompra.descuento < 0 || formCompra.descuento > 100)) {
      showToast("El descuento debe estar entre 0 y 100.", "error"); return;
    }

    setSavingCompra(true);
    try {
      const res = await fetch(`${API}/compras`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idProducto: formCompra.idProducto,
          cantidad: formCompra.cantidad,
          precioUnit: formCompra.precioUnit,
          descuento: formCompra.aplicarDescuento ? formCompra.descuento : 0,
          notas: formCompra.notas.trim() || null,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || "Error al registrar la compra.");

      showToast("Compra registrada correctamente.", "success");
      closeCompra();
      fetchProductos();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Error inesperado", "error");
    } finally {
      setSavingCompra(false);
    }
  };

  /* ─── Derived data ───────────────────────────── */
  const totalProductos = productos.length;
  const totalUnidades = productos.reduce((sum, p) => sum + p.cantidad, 0);
  const bajosDeStock = productos.filter((p) => p.cantidad <= p.stockMinimo).length;

  /* ─── Formatting ─────────────────────────────── */
  const fmtPrecio = (n: number) =>
    new Intl.NumberFormat("es-CR", { style: "currency", currency: "CRC" }).format(n);

  /* ─── Render ─────────────────────────────────── */
  if (!authChecked) return null;

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Inventario</h1>
        <div className={styles.headerActions}>
          <button
            id="btn-back"
            className={`${styles.btn} ${styles.btnSecondary}`}
            onClick={() => router.push("/dashboard")}
          >
            ← Volver
          </button>
          <button
            id="btn-registrar-compra"
            className={`${styles.btn} ${styles.btnSecondary}`}
            onClick={openCompra}
          >
            Registrar compra
          </button>
          <button
            id="btn-add"
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={openCreate}
          >
            + Agregar
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`${styles.toast} ${
            toast.type === "success" ? styles.toastSuccess : styles.toastError
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Filters */}
      <div className={styles.searchBar}>
        <div className={styles.filterGrid}>
          <input
            id="search-productos"
            className={styles.searchInput}
            type="text"
            placeholder="Nombre del producto"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <input
            id="search-codigo"
            className={styles.searchInput}
            type="text"
            placeholder="Código"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
          />
          <input
            id="search-precio-min"
            className={styles.searchInput}
            type="number"
            min={0}
            step={0.01}
            placeholder="Precio mínimo"
            value={precioMin}
            onChange={(e) => setPrecioMin(e.target.value)}
          />
          <input
            id="search-precio-max"
            className={styles.searchInput}
            type="number"
            min={0}
            step={0.01}
            placeholder="Precio máximo"
            value={precioMax}
            onChange={(e) => setPrecioMax(e.target.value)}
          />
          <input
            id="search-cantidad-min"
            className={styles.searchInput}
            type="number"
            min={0}
            step={1}
            placeholder="Cantidad mínima"
            value={cantidadMin}
            onChange={(e) => setCantidadMin(e.target.value)}
          />
          <input
            id="search-cantidad-max"
            className={styles.searchInput}
            type="number"
            min={0}
            step={1}
            placeholder="Cantidad máxima"
            value={cantidadMax}
            onChange={(e) => setCantidadMax(e.target.value)}
          />
        </div>

        <div className={styles.filterActions}>
          <button
            className={`${styles.btn} ${styles.btnPrimary}`}
            type="button"
            onClick={aplicarFiltros}
          >
            Aplicar filtros
          </button>
          <button
            className={`${styles.btn} ${styles.btnSecondary}`}
            type="button"
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
          <div className={styles.loading}>Cargando productos...</div>
        ) : filtered.length === 0 ? (
          <div className={styles.emptyState}>
            {hasActiveFilters
              ? "No se encontraron resultados para los filtros aplicados."
              : "No hay productos registrados."}
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Código</th>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Precio</th>
                <th style={{ textAlign: "right" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id}>
                  <td>{p.codigo}</td>
                  <td>{p.nombre}</td>
                  <td>
                    {p.cantidad <= p.stockMinimo ? (
                      <span className={styles.stockWarning}>{p.cantidad}</span>
                    ) : (
                      p.cantidad
                    )}
                  </td>
                  <td>{fmtPrecio(p.precio)}</td>
                  <td>
                    <div className={styles.tdActions}>
                      <button
                        className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSmall}`}
                        onClick={() => openEdit(p)}
                      >
                        Editar
                      </button>
                      <button
                        className={`${styles.btn} ${styles.btnDanger} ${styles.btnSmall}`}
                        onClick={() => setConfirmDelete(p)}
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

      {/* Summary bar */}
      {!loading && productos.length > 0 && (
        <div className={styles.summary}>
          <span className={styles.summaryItem}>
            Productos: <span className={styles.summaryValue}>{totalProductos}</span>
          </span>
          <span className={styles.summaryItem}>
            Unidades totales: <span className={styles.summaryValue}>{totalUnidades}</span>
          </span>
          {bajosDeStock > 0 && (
            <span className={styles.summaryItem}>
              Stock bajo: <span className={styles.summaryValue}>{bajosDeStock}</span>
            </span>
          )}
        </div>
      )}

      {/* ── Create / Edit modal ──────────────────── */}
      {showModal && (
        <div className={styles.overlay} onClick={closeModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>
              {editingId !== null ? "Editar producto" : "Nuevo producto"}
            </h2>

            <form className={styles.form} onSubmit={handleSave}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="inp-nombre">
                  Nombre
                </label>
                <input
                  id="inp-nombre"
                  className={styles.input}
                  type="text"
                  placeholder="Ej: Shampoo Profesional"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  required
                  autoFocus
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="inp-cantidad">
                  Cantidad en stock
                </label>
                <input
                  id="inp-cantidad"
                  className={styles.input}
                  type="number"
                  min={0}
                  value={form.cantidad}
                  onChange={(e) => setForm({ ...form, cantidad: Number(e.target.value) })}
                  onFocus={(e) => { const t = e.target; setTimeout(() => t.select(), 0); }}
                  required
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="inp-precio">
                  Precio (₡)
                </label>
                <input
                  id="inp-precio"
                  className={styles.input}
                  type="number"
                  min={0}
                  step="any"
                  value={form.precio}
                  onChange={(e) => setForm({ ...form, precio: Number(e.target.value) })}
                  onFocus={(e) => { const t = e.target; setTimeout(() => t.select(), 0); }}
                  required
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="inp-stock-min">
                  Stock mínimo
                </label>
                <input
                  id="inp-stock-min"
                  className={styles.input}
                  type="number"
                  min={0}
                  value={form.stockMinimo}
                  onChange={(e) => setForm({ ...form, stockMinimo: Number(e.target.value) })}
                  onFocus={(e) => { const t = e.target; setTimeout(() => t.select(), 0); }}
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
                  {saving ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete confirmation modal ────────────── */}
      {confirmDelete && (
        <div className={styles.overlay} onClick={() => setConfirmDelete(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Confirmar eliminación</h2>
            <p className={styles.confirmText}>
              ¿Está seguro que desea eliminar{" "}
              <span className={styles.confirmName}>{confirmDelete.nombre}</span>? Esta acción
              no se puede deshacer.
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

      {/* ── Registrar compra modal (IP-006) ─────── */}
      {showModalCompra && (
        <div className={styles.overlay} onClick={closeCompra}>
          <div className={`${styles.modal} ${styles.modalCompra}`} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Registrar compra</h2>

            <form className={styles.form} onSubmit={handleRegistrarCompra}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="inp-compra-producto">
                  Producto
                </label>
                <select
                  id="inp-compra-producto"
                  className={styles.input}
                  value={formCompra.idProducto ?? ""}
                  onChange={(e) =>
                    setFormCompra({ ...formCompra, idProducto: e.target.value ? Number(e.target.value) : null })
                  }
                  required
                >
                  <option value="">Seleccione un producto…</option>
                  {productos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} ({p.codigo}) — stock: {p.cantidad}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="inp-compra-cantidad">
                  Cantidad
                </label>
                <input
                  id="inp-compra-cantidad"
                  className={styles.input}
                  type="number"
                  min={1}
                  value={formCompra.cantidad}
                  onChange={(e) => setFormCompra({ ...formCompra, cantidad: Number(e.target.value) })}
                  onFocus={(e) => { const t = e.target; setTimeout(() => t.select(), 0); }}
                  required
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="inp-compra-precio">
                  Precio unitario (₡)
                </label>
                <input
                  id="inp-compra-precio"
                  className={styles.input}
                  type="number"
                  min={0}
                  step="any"
                  value={formCompra.precioUnit}
                  onChange={(e) => setFormCompra({ ...formCompra, precioUnit: Number(e.target.value) })}
                  onFocus={(e) => { const t = e.target; setTimeout(() => t.select(), 0); }}
                  required
                />
              </div>

              {/* Descuento toggle (IP-005 sub-flow) */}
              <div className={styles.checkboxRow}>
                <input
                  id="inp-compra-aplica-descuento"
                  type="checkbox"
                  checked={formCompra.aplicarDescuento}
                  onChange={(e) => setFormCompra({ ...formCompra, aplicarDescuento: e.target.checked, descuento: 0 })}
                />
                <label htmlFor="inp-compra-aplica-descuento" className={styles.label}>
                  Aplicar descuento
                </label>
              </div>

              {formCompra.aplicarDescuento && (
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="inp-compra-descuento">
                    Descuento (%)
                  </label>
                  <input
                    id="inp-compra-descuento"
                    className={styles.input}
                    type="number"
                    min={0}
                    max={100}
                    step="any"
                    value={formCompra.descuento}
                    onChange={(e) => setFormCompra({ ...formCompra, descuento: Number(e.target.value) })}
                    onFocus={(e) => { const t = e.target; setTimeout(() => t.select(), 0); }}
                  />
                </div>
              )}

              {/* Live subtotal */}
              <div className={styles.subtotalRow}>
                <span className={styles.subtotalLabel}>Subtotal estimado:</span>
                <span className={styles.subtotalValue}>
                  {fmtPrecio(
                    formCompra.cantidad *
                      formCompra.precioUnit *
                      (1 - (formCompra.aplicarDescuento ? formCompra.descuento : 0) / 100)
                  )}
                </span>
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="inp-compra-notas">
                  Notas (opcional)
                </label>
                <input
                  id="inp-compra-notas"
                  className={styles.input}
                  type="text"
                  maxLength={255}
                  placeholder="Ej: Pedido regular mensual"
                  value={formCompra.notas}
                  onChange={(e) => setFormCompra({ ...formCompra, notas: e.target.value })}
                />
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnSecondary}`}
                  onClick={closeCompra}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`${styles.btn} ${styles.btnPrimary}`}
                  disabled={savingCompra}
                >
                  {savingCompra ? "Registrando..." : "Registrar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}