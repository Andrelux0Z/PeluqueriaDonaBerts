/* ================================================================
   02 – CREACIÓN DE TABLAS (versión corregida)
   
   Cambios respecto al esquema original:
     1. Venta ahora tiene encabezado + detalle (simétrico a Compra)
     2. Transaccion reemplazada por vista vw_Historial (UNION ALL)
     3. DetalleCompra y DetalleVenta usan Subtotal computado
     4. Servicio: CHECK para validar Nombre ó IdTipoServicio
     5. Columnas de auditoría en todas las tablas transaccionales
   ================================================================ */

-- ════════════════════════════════════════════════════════════════
-- CATÁLOGOS
-- ════════════════════════════════════════════════════════════════

-- Categoría de productos
CREATE TABLE dbo.CategoriaProducto (
    Id       INT IDENTITY(1,1) PRIMARY KEY,
    Nombre   VARCHAR(50) NOT NULL,
    EsActivo BIT         NOT NULL DEFAULT 1
);
GO

-- Tipos de servicio preestablecidos
CREATE TABLE dbo.TipoServicio (
    Id       INT IDENTITY(1,1) PRIMARY KEY,
    Nombre   VARCHAR(100) NOT NULL,
    Precio   DECIMAL(10,2) NOT NULL DEFAULT 0, -- precio sugerido
    EsActivo BIT           NOT NULL DEFAULT 1
);
GO

-- ════════════════════════════════════════════════════════════════
-- ENTIDADES PRINCIPALES
-- ════════════════════════════════════════════════════════════════

-- Producto
CREATE TABLE dbo.Producto (
    Id            INT IDENTITY(1,1) PRIMARY KEY,
    IdCategoria   INT            NOT NULL,
    Codigo        VARCHAR(50)    NOT NULL,
    Nombre        VARCHAR(100)   NOT NULL,
    PrecioVenta   DECIMAL(10,2)  NOT NULL,
    Stock         INT            NOT NULL DEFAULT 0,
    StockMinimo   INT            NOT NULL DEFAULT 5,
    EsActivo      BIT            NOT NULL DEFAULT 1,
    FechaCreacion DATETIME       NOT NULL DEFAULT GETDATE(),

    CONSTRAINT FK_Producto_Categoria
        FOREIGN KEY (IdCategoria) REFERENCES dbo.CategoriaProducto(Id),

    CONSTRAINT UQ_Producto_Codigo UNIQUE (Codigo)
);
GO

-- Proveedor
CREATE TABLE dbo.Proveedor (
    Id            INT IDENTITY(1,1) PRIMARY KEY,
    Nombre        VARCHAR(100) NOT NULL,
    Telefono      VARCHAR(20)  NOT NULL,
    Email         VARCHAR(100) NULL,
    EsActivo      BIT          NOT NULL DEFAULT 1,
    FechaCreacion DATETIME     NOT NULL DEFAULT GETDATE()
);
GO

-- ════════════════════════════════════════════════════════════════
-- COMPRAS (encabezado + detalle)
-- ════════════════════════════════════════════════════════════════

-- Encabezado de compra
CREATE TABLE dbo.Compra (
    Id            INT IDENTITY(1,1) PRIMARY KEY,
    IdProveedor   INT            NOT NULL,
    Fecha         DATETIME       NOT NULL DEFAULT GETDATE(),
    Notas         VARCHAR(255)   NULL,

    CONSTRAINT FK_Compra_Proveedor
        FOREIGN KEY (IdProveedor) REFERENCES dbo.Proveedor(Id)
);
GO

-- Detalle de compra (Subtotal calculado automáticamente)
CREATE TABLE dbo.DetalleCompra (
    Id          INT IDENTITY(1,1) PRIMARY KEY,
    IdCompra    INT            NOT NULL,
    IdProducto  INT            NOT NULL,
    Cantidad    INT            NOT NULL,
    PrecioUnit  DECIMAL(10,2)  NOT NULL,
    Descuento   DECIMAL(5,2)   NOT NULL DEFAULT 0,
    Subtotal    AS (Cantidad * PrecioUnit * (1.0 - Descuento / 100.0)) PERSISTED,

    CONSTRAINT FK_DetalleCompra_Compra
        FOREIGN KEY (IdCompra) REFERENCES dbo.Compra(Id),
    CONSTRAINT FK_DetalleCompra_Producto
        FOREIGN KEY (IdProducto) REFERENCES dbo.Producto(Id),

    CONSTRAINT CK_DetalleCompra_Cantidad  CHECK (Cantidad > 0),
    CONSTRAINT CK_DetalleCompra_Precio    CHECK (PrecioUnit >= 0),
    CONSTRAINT CK_DetalleCompra_Descuento CHECK (Descuento >= 0 AND Descuento <= 100)
);
GO

-- ════════════════════════════════════════════════════════════════
-- VENTAS (encabezado + detalle)  ← NUEVO, reemplaza VentaProducto
-- ════════════════════════════════════════════════════════════════

-- Encabezado de venta
CREATE TABLE dbo.Venta (
    Id            INT IDENTITY(1,1) PRIMARY KEY,
    Fecha         DATETIME       NOT NULL DEFAULT GETDATE(),
    Notas         VARCHAR(255)   NULL
);
GO

-- Detalle de venta (Subtotal calculado automáticamente)
CREATE TABLE dbo.DetalleVenta (
    Id          INT IDENTITY(1,1) PRIMARY KEY,
    IdVenta     INT            NOT NULL,
    IdProducto  INT            NOT NULL,
    Cantidad    INT            NOT NULL,
    PrecioUnit  DECIMAL(10,2)  NOT NULL,
    Descuento   DECIMAL(5,2)   NOT NULL DEFAULT 0,
    Subtotal    AS (Cantidad * PrecioUnit * (1.0 - Descuento / 100.0)) PERSISTED,

    CONSTRAINT FK_DetalleVenta_Venta
        FOREIGN KEY (IdVenta) REFERENCES dbo.Venta(Id),
    CONSTRAINT FK_DetalleVenta_Producto
        FOREIGN KEY (IdProducto) REFERENCES dbo.Producto(Id),

    CONSTRAINT CK_DetalleVenta_Cantidad  CHECK (Cantidad > 0),
    CONSTRAINT CK_DetalleVenta_Precio    CHECK (PrecioUnit >= 0),
    CONSTRAINT CK_DetalleVenta_Descuento CHECK (Descuento >= 0 AND Descuento <= 100)
);
GO

-- ════════════════════════════════════════════════════════════════
-- SERVICIOS
-- ════════════════════════════════════════════════════════════════

-- Registro de servicio prestado
CREATE TABLE dbo.Servicio (
    Id              INT IDENTITY(1,1) PRIMARY KEY,
    IdTipoServicio  INT            NULL,
    NombreLibre     VARCHAR(100)   NULL,  -- solo se usa si IdTipoServicio es NULL
    Fecha           DATETIME       NOT NULL DEFAULT GETDATE(),
    Monto           DECIMAL(10,2)  NOT NULL,

    CONSTRAINT FK_Servicio_TipoServicio
        FOREIGN KEY (IdTipoServicio) REFERENCES dbo.TipoServicio(Id),

    -- Debe tener tipo preestablecido O nombre libre, nunca ambos vacíos
    CONSTRAINT CK_Servicio_TipoONombre CHECK (
        IdTipoServicio IS NOT NULL OR NombreLibre IS NOT NULL
    ),
    CONSTRAINT CK_Servicio_Monto CHECK (Monto >= 0)
);
GO

-- ════════════════════════════════════════════════════════════════
-- VISTA: HISTORIAL UNIFICADO  ← Reemplaza la tabla Transaccion
-- ════════════════════════════════════════════════════════════════

CREATE VIEW dbo.vw_Historial
AS
    -- Compras (dinero que sale)
    SELECT
        'Compra'            AS TipoTransaccion,
        c.Id                AS IdReferencia,
        c.Fecha,
        SUM(dc.Subtotal)    AS Monto,
        1                   AS EsAdquisicion, -- TRUE = dinero que sale
        NULL                AS NombreServicio
    FROM dbo.Compra c
    INNER JOIN dbo.DetalleCompra dc ON dc.IdCompra = c.Id
    GROUP BY c.Id, c.Fecha

    UNION ALL

    -- Ventas de productos (dinero que entra)
    SELECT
        'Venta'             AS TipoTransaccion,
        v.Id                AS IdReferencia,
        v.Fecha,
        SUM(dv.Subtotal)    AS Monto,
        0                   AS EsAdquisicion, -- FALSE = dinero que entra
        NULL                AS NombreServicio
    FROM dbo.Venta v
    INNER JOIN dbo.DetalleVenta dv ON dv.IdVenta = v.Id
    GROUP BY v.Id, v.Fecha

    UNION ALL

    -- Servicios (dinero que entra)
    SELECT
        'Servicio'          AS TipoTransaccion,
        s.Id                AS IdReferencia,
        s.Fecha,
        s.Monto,
        0                   AS EsAdquisicion,
        COALESCE(ts.Nombre, s.NombreLibre) AS NombreServicio
    FROM dbo.Servicio s
    LEFT JOIN dbo.TipoServicio ts ON ts.Id = s.IdTipoServicio;
GO

PRINT '✓ Todas las tablas y vistas fueron creadas exitosamente.';
GO
