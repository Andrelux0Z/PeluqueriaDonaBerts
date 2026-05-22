"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import styles from "./productos.module.css";

const API = "http://localhost:5149/api/productos";

/* ─── Types ──────────────────────────────────── */
interface Producto {
  id: number;
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

  const [productos, setProductos] = useState<Producto[]>([]);
  const [filtered, setFiltered] = useState<Producto[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<Toast | null>(null);

  /* Modal state */
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  /* Delete confirm */
  const [confirmDelete, setConfirmDelete] = useState<Producto | null>(null);

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
    fetchProductos();
  }, [fetchProductos]);

  /* ─── Search filter ──────────────────────────── */
  useEffect(() => {
    if (!search.trim()) {
      setFiltered(productos);
      return;
    }
    const q = search.toLowerCase();
    setFiltered(productos.filter((p) => p.nombre.toLowerCase().includes(q)));
  }, [search, productos]);

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

  /* ─── Derived data ───────────────────────────── */
  const totalProductos = productos.length;
  const totalUnidades = productos.reduce((sum, p) => sum + p.cantidad, 0);
  const bajosDeStock = productos.filter((p) => p.cantidad <= p.stockMinimo).length;

  /* ─── Formatting ─────────────────────────────── */
  const fmtPrecio = (n: number) =>
    new Intl.NumberFormat("es-CR", { style: "currency", currency: "CRC" }).format(n);

  /* ─── Render ─────────────────────────────────── */
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

      {/* Search */}
      <div className={styles.searchBar}>
        <input
          id="search-productos"
          className={styles.searchInput}
          type="text"
          placeholder="Buscar producto por nombre..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className={styles.tableWrapper}>
        {loading ? (
          <div className={styles.loading}>Cargando productos...</div>
        ) : filtered.length === 0 ? (
          <div className={styles.emptyState}>
            {search ? "No se encontraron resultados." : "No hay productos registrados."}
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Precio</th>
                <th style={{ textAlign: "right" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id}>
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
              ⚠ Stock bajo: <span className={styles.summaryValue}>{bajosDeStock}</span>
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
                  step={0.01}
                  value={form.precio}
                  onChange={(e) => setForm({ ...form, precio: Number(e.target.value) })}
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
    </div>
  );
}