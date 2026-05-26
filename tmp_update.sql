ALTER VIEW dbo.vw_Historial
AS
    -- Compras (dinero que sale)
    SELECT
        'Compra'            AS TipoTransaccion,
        c.Id                AS IdReferencia,
        c.Fecha,
        SUM(dc.Subtotal)    AS Monto,
        1                   AS EsAdquisicion, -- TRUE = dinero que sale
        MAX(p.Nombre)       AS Detalle
    FROM dbo.Compra c
    INNER JOIN dbo.DetalleCompra dc ON dc.IdCompra = c.Id
    INNER JOIN dbo.Producto p ON p.Id = dc.IdProducto
    GROUP BY c.Id, c.Fecha

    UNION ALL

    -- Ventas de productos (dinero que entra)
    SELECT
        'Venta'             AS TipoTransaccion,
        v.Id                AS IdReferencia,
        v.Fecha,
        SUM(dv.Subtotal)    AS Monto,
        0                   AS EsAdquisicion, -- FALSE = dinero que entra
        MAX(p.Nombre)       AS Detalle
    FROM dbo.Venta v
    INNER JOIN dbo.DetalleVenta dv ON dv.IdVenta = v.Id
    INNER JOIN dbo.Producto p ON p.Id = dv.IdProducto
    GROUP BY v.Id, v.Fecha

    UNION ALL

    -- Servicios (dinero que entra)
    SELECT
        'Servicio'          AS TipoTransaccion,
        s.Id                AS IdReferencia,
        s.Fecha,
        s.Monto,
        0                   AS EsAdquisicion,
        COALESCE(ts.Nombre, s.NombreLibre) AS Detalle
    FROM dbo.Servicio s
    LEFT JOIN dbo.TipoServicio ts ON ts.Id = s.IdTipoServicio;
GO

ALTER PROCEDURE dbo.sp_ListarHistorial
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
        Detalle
    FROM dbo.vw_Historial
    WHERE (@inTipoTransaccion IS NULL OR TipoTransaccion = @inTipoTransaccion)
      AND (@inFechaInicio IS NULL OR Fecha >= @inFechaInicio)
      AND (@inFechaFin IS NULL OR Fecha <= DATEADD(DAY, 1, @inFechaFin))
      AND (@inMontoMin IS NULL OR Monto >= @inMontoMin)
      AND (@inMontoMax IS NULL OR Monto <= @inMontoMax)
      AND (@inDetalle IS NULL OR Detalle LIKE '%' + @inDetalle + '%')
    ORDER BY Fecha DESC;
END;
GO
