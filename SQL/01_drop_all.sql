/* ================================================================
   01 – LIMPIEZA COMPLETA
   Elimina todas las tablas y vistas del módulo de inventario.
   Orden inverso de dependencias para evitar errores de FK.
   ================================================================ */

-- ── Vistas ──────────────────────────────────────────────────────
IF OBJECT_ID('dbo.vw_Historial', 'V') IS NOT NULL
    DROP VIEW dbo.vw_Historial;
GO

-- ── Tablas de detalle (dependen de encabezados) ────────────────
IF OBJECT_ID('dbo.DetalleCompra', 'U') IS NOT NULL
    DROP TABLE dbo.DetalleCompra;
GO

IF OBJECT_ID('dbo.DetalleVenta', 'U') IS NOT NULL
    DROP TABLE dbo.DetalleVenta;
GO

-- ── Tablas de encabezado ───────────────────────────────────────
IF OBJECT_ID('dbo.Compra', 'U') IS NOT NULL
    DROP TABLE dbo.Compra;
GO

IF OBJECT_ID('dbo.Venta', 'U') IS NOT NULL
    DROP TABLE dbo.Venta;
GO

IF OBJECT_ID('dbo.Servicio', 'U') IS NOT NULL
    DROP TABLE dbo.Servicio;
GO

-- ── Tabla polimórfica vieja (si existe) ────────────────────────
IF OBJECT_ID('dbo.Transaccion', 'U') IS NOT NULL
    DROP TABLE dbo.Transaccion;
GO

IF OBJECT_ID('dbo.VentaProducto', 'U') IS NOT NULL
    DROP TABLE dbo.VentaProducto;
GO

-- ── Catálogos y entidades principales ──────────────────────────
IF OBJECT_ID('dbo.Producto', 'U') IS NOT NULL
    DROP TABLE dbo.Producto;
GO

IF OBJECT_ID('dbo.CategoriaProducto', 'U') IS NOT NULL
    DROP TABLE dbo.CategoriaProducto;
GO

IF OBJECT_ID('dbo.Proveedor', 'U') IS NOT NULL
    DROP TABLE dbo.Proveedor;
GO

IF OBJECT_ID('dbo.TipoServicio', 'U') IS NOT NULL
    DROP TABLE dbo.TipoServicio;
GO

PRINT '✓ Limpieza completa. Todas las tablas y vistas del inventario fueron eliminadas.';
GO
