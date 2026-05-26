/* ================================================================
   04 – STORED PROCEDURES
   
   Procedimientos almacenados para el sistema PeluqueriaDonaBerts.
   Ejecutar DESPUÉS de 02_create_tables.sql y 03_test_data.sql.

   Convenciones:
     • Prefijo sp_ para todos los procedimientos
     • @in  para parámetros de entrada
     • @out para parámetros de salida
     • SET NOCOUNT ON en todos
     • TRY/CATCH con @outResultCode = 50000 + ERROR_NUMBER() en fallo
     • IF EXISTS DROP antes de cada CREATE
   ================================================================ */

-- ════════════════════════════════════════════════════════════════
-- 1. sp_ListarProductos
--    Devuelve todos los productos activos.
--    IMPORTANTE: los alias (Cantidad, Precio) coinciden con los
--    nombres que lee el controlador C# vía reader.GetOrdinal().
-- ════════════════════════════════════════════════════════════════

IF OBJECT_ID('dbo.sp_ListarProductos', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_ListarProductos;
GO

CREATE PROCEDURE dbo.sp_ListarProductos
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        Id,
        Codigo,
        Nombre,
        Stock        AS Cantidad,     -- el controlador espera "Cantidad"
        PrecioVenta  AS Precio,       -- el controlador espera "Precio"
        StockMinimo
    FROM dbo.Producto
    WHERE EsActivo = 1
    ORDER BY Nombre;
END;
GO

-- ════════════════════════════════════════════════════════════════
-- 1.1 sp_FiltrarProductos
--    Devuelve productos activos aplicando filtros por nombre, código,
--    rango de precio y rango de cantidad.
-- ════════════════════════════════════════════════════════════════

IF OBJECT_ID('dbo.sp_FiltrarProductos', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_FiltrarProductos;
GO

CREATE PROCEDURE dbo.sp_FiltrarProductos
    @inNombre       VARCHAR(100) = NULL,
    @inCodigo       VARCHAR(50)  = NULL,
    @inPrecioMin    DECIMAL(10,2) = NULL,
    @inPrecioMax    DECIMAL(10,2) = NULL,
    @inCantidadMin  INT = NULL,
    @inCantidadMax  INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        Id,
        Codigo,
        Nombre,
        Stock        AS Cantidad,
        PrecioVenta  AS Precio,
        StockMinimo
    FROM dbo.Producto
    WHERE EsActivo = 1
      AND (@inNombre IS NULL OR Nombre LIKE '%' + @inNombre + '%')
      AND (@inCodigo IS NULL OR Codigo LIKE '%' + @inCodigo + '%')
      AND (@inPrecioMin IS NULL OR PrecioVenta >= @inPrecioMin)
      AND (@inPrecioMax IS NULL OR PrecioVenta <= @inPrecioMax)
      AND (@inCantidadMin IS NULL OR Stock >= @inCantidadMin)
      AND (@inCantidadMax IS NULL OR Stock <= @inCantidadMax)
    ORDER BY Nombre;
END;
GO

-- ════════════════════════════════════════════════════════════════
-- 2. sp_InsertarProducto
--    Crea un producto nuevo con IdCategoria = 1 por defecto
--    y auto-genera el Codigo como 'PROD-XXXXX'.
-- ════════════════════════════════════════════════════════════════

IF OBJECT_ID('dbo.sp_InsertarProducto', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_InsertarProducto;
GO

CREATE PROCEDURE dbo.sp_InsertarProducto
    @inNombre       VARCHAR(100),
    @inCantidad     INT,
    @inPrecio       DECIMAL(10,2),
    @inStockMinimo  INT,
    @outResultCode  INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET @outResultCode = 0;

    BEGIN TRY
        -- Auto-generar código basado en el máximo Id actual
        DECLARE @nextId   INT;
        DECLARE @codigo   VARCHAR(50);

        SELECT @nextId = ISNULL(MAX(Id), 0) + 1
        FROM dbo.Producto;

        SET @codigo = 'PROD-' + RIGHT('00000' + CAST(@nextId AS VARCHAR(5)), 5);

        INSERT INTO dbo.Producto (IdCategoria, Codigo, Nombre, PrecioVenta, Stock, StockMinimo)
        VALUES (1, @codigo, @inNombre, @inPrecio, @inCantidad, @inStockMinimo);

    END TRY
    BEGIN CATCH
        SET @outResultCode = 50000 + ERROR_NUMBER();
    END CATCH;
END;
GO

-- ════════════════════════════════════════════════════════════════
-- 3. sp_ActualizarProducto
--    Actualiza nombre, stock, precio y stock mínimo de un producto.
-- ════════════════════════════════════════════════════════════════

IF OBJECT_ID('dbo.sp_ActualizarProducto', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_ActualizarProducto;
GO

CREATE PROCEDURE dbo.sp_ActualizarProducto
    @inId           INT,
    @inNombre       VARCHAR(100),
    @inCantidad     INT,
    @inPrecio       DECIMAL(10,2),
    @inStockMinimo  INT,
    @outResultCode  INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET @outResultCode = 0;

    BEGIN TRY
        -- Verificar que el producto existe y está activo
        IF NOT EXISTS (SELECT 1 FROM dbo.Producto WHERE Id = @inId AND EsActivo = 1)
        BEGIN
            SET @outResultCode = 50001;  -- Producto no encontrado o inactivo
            RETURN;
        END;

        UPDATE dbo.Producto
        SET Nombre      = @inNombre,
            Stock       = @inCantidad,
            PrecioVenta = @inPrecio,
            StockMinimo = @inStockMinimo
        WHERE Id = @inId
          AND EsActivo = 1;

    END TRY
    BEGIN CATCH
        SET @outResultCode = 50000 + ERROR_NUMBER();
    END CATCH;
END;
GO

-- ════════════════════════════════════════════════════════════════
-- 4. sp_EliminarProducto
--    Eliminación lógica (soft delete): pone EsActivo = 0.
-- ════════════════════════════════════════════════════════════════

IF OBJECT_ID('dbo.sp_EliminarProducto', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_EliminarProducto;
GO

CREATE PROCEDURE dbo.sp_EliminarProducto
    @inId           INT,
    @outResultCode  INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET @outResultCode = 0;

    BEGIN TRY
        -- Verificar que el producto existe y está activo
        IF NOT EXISTS (SELECT 1 FROM dbo.Producto WHERE Id = @inId AND EsActivo = 1)
        BEGIN
            SET @outResultCode = 50001;  -- Producto no encontrado o ya eliminado
            RETURN;
        END;

        UPDATE dbo.Producto
        SET EsActivo = 0
        WHERE Id = @inId;

    END TRY
    BEGIN CATCH
        SET @outResultCode = 50000 + ERROR_NUMBER();
    END CATCH;
END;
GO

-- ════════════════════════════════════════════════════════════════
-- 5. sp_ListarServicios
--    Devuelve todos los servicios con el nombre resuelto:
--    si tiene TipoServicio usa ese nombre, si no usa NombreLibre.
-- ════════════════════════════════════════════════════════════════

IF OBJECT_ID('dbo.sp_ListarServicios', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_ListarServicios;
GO

CREATE PROCEDURE dbo.sp_ListarServicios
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        s.Id,
        ISNULL(ts.Nombre, s.NombreLibre)  AS Nombre,
        s.Fecha,
        s.Monto
    FROM dbo.Servicio s
    LEFT JOIN dbo.TipoServicio ts ON ts.Id = s.IdTipoServicio
    ORDER BY s.Fecha DESC;
END;
GO

-- ════════════════════════════════════════════════════════════════
-- 6. sp_InsertarServicio
--    Registra un nuevo servicio prestado.
--    @inIdTipoServicio puede ser NULL si se usa @inNombreLibre.
-- ════════════════════════════════════════════════════════════════

IF OBJECT_ID('dbo.sp_InsertarServicio', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_InsertarServicio;
GO

CREATE PROCEDURE dbo.sp_InsertarServicio
    @inIdTipoServicio  INT           = NULL,
    @inNombreLibre     VARCHAR(100)  = NULL,
    @inMonto           DECIMAL(10,2),
    @outResultCode     INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET @outResultCode = 0;

    BEGIN TRY
        -- Validar que al menos uno de los dos campos de nombre esté presente
        -- (la tabla tiene un CHECK, pero validamos antes para dar error claro)
        IF @inIdTipoServicio IS NULL AND @inNombreLibre IS NULL
        BEGIN
            SET @outResultCode = 50002;  -- Debe indicar tipo de servicio o nombre libre
            RETURN;
        END;

        INSERT INTO dbo.Servicio (IdTipoServicio, NombreLibre, Monto)
        VALUES (@inIdTipoServicio, @inNombreLibre, @inMonto);

    END TRY
    BEGIN CATCH
        SET @outResultCode = 50000 + ERROR_NUMBER();
    END CATCH;
END;
GO

-- ════════════════════════════════════════════════════════════════
-- 7. sp_EliminarServicio
--    Eliminación física (hard delete) del servicio.
-- ════════════════════════════════════════════════════════════════

IF OBJECT_ID('dbo.sp_EliminarServicio', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_EliminarServicio;
GO

CREATE PROCEDURE dbo.sp_EliminarServicio
    @inId           INT,
    @outResultCode  INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET @outResultCode = 0;

    BEGIN TRY
        -- Verificar que el servicio existe
        IF NOT EXISTS (SELECT 1 FROM dbo.Servicio WHERE Id = @inId)
        BEGIN
            SET @outResultCode = 50001;  -- Servicio no encontrado
            RETURN;
        END;

        DELETE FROM dbo.Servicio
        WHERE Id = @inId;

    END TRY
    BEGIN CATCH
        SET @outResultCode = 50000 + ERROR_NUMBER();
    END CATCH;
END;
GO

-- ════════════════════════════════════════════════════════════════
-- 8. sp_ListarHistorial
--    Devuelve el historial unificado desde la vista vw_Historial
--    ordenado por fecha descendente (más reciente primero).
-- ════════════════════════════════════════════════════════════════

IF OBJECT_ID('dbo.sp_ListarHistorial', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_ListarHistorial;
GO

CREATE PROCEDURE dbo.sp_ListarHistorial
    @inTipoTransaccion VARCHAR(50) = NULL,
    @inFechaInicio     DATETIME = NULL,
    @inFechaFin        DATETIME = NULL,
    @inMontoMin        DECIMAL(10,2) = NULL,
    @inMontoMax        DECIMAL(10,2) = NULL,
    @inDetalle         VARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        TipoTransaccion,
        IdReferencia,
        Fecha,
        Monto,
        EsAdquisicion,
        NombreServicio
    FROM dbo.vw_Historial
    WHERE (@inTipoTransaccion IS NULL OR TipoTransaccion = @inTipoTransaccion)
      AND (@inFechaInicio IS NULL OR Fecha >= @inFechaInicio)
      AND (@inFechaFin IS NULL OR Fecha <= @inFechaFin)
      AND (@inMontoMin IS NULL OR Monto >= @inMontoMin)
      AND (@inMontoMax IS NULL OR Monto <= @inMontoMax)
      AND (@inDetalle IS NULL OR Detalle LIKE '%' + @inDetalle + '%')
    ORDER BY Fecha DESC;
END;
GO

-- ════════════════════════════════════════════════════════════════
-- VERIFICACIÓN
-- ════════════════════════════════════════════════════════════════

PRINT '✓ Todos los stored procedures fueron creados exitosamente:';
PRINT '    • sp_ListarProductos';
PRINT '    • sp_InsertarProducto';
PRINT '    • sp_ActualizarProducto';
PRINT '    • sp_EliminarProducto';
PRINT '    • sp_ListarServicios';
PRINT '    • sp_InsertarServicio';
PRINT '    • sp_EliminarServicio';
PRINT '    • sp_ListarHistorial';
GO
