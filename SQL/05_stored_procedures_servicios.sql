/* ================================================================
   05 – STORED PROCEDURES (Servicios)
   
   Procedimientos almacenados para el sistema PeluqueriaDonaBerts 
   específicos para el controlador de Servicios.
   ================================================================ */

-- ════════════════════════════════════════════════════════════════
-- 1. sp_ObtenerTiposServicio
-- ════════════════════════════════════════════════════════════════
IF OBJECT_ID('dbo.sp_ObtenerTiposServicio', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_ObtenerTiposServicio;
GO

CREATE PROCEDURE dbo.sp_ObtenerTiposServicio
    @outResultCode INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET @outResultCode = 0;

    BEGIN TRY
        SELECT 
            Id, 
            Nombre AS NombreServicio, 
            Descripcion,
            Precio AS PrecioBase
        FROM dbo.TipoServicio
        WHERE EsActivo = 1
        ORDER BY Nombre;
    END TRY
    BEGIN CATCH
        SET @outResultCode = 50000 + ERROR_NUMBER();
    END CATCH;
END;
GO

-- ════════════════════════════════════════════════════════════════
-- 2. sp_RegistrarServicio
-- ════════════════════════════════════════════════════════════════
IF OBJECT_ID('dbo.sp_RegistrarServicio', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_RegistrarServicio;
GO

CREATE PROCEDURE dbo.sp_RegistrarServicio
    @inIdTipoServicio INT,
    @inNombreLibre    VARCHAR(100),
    @inFecha          DATETIME,
    @inMonto          DECIMAL(10,2),
    @inIdPostByUser   INT,
    @inIpPostIn       VARCHAR(50),
    @outResultCode    INT OUTPUT,
    @outIdServicio    INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET @outResultCode = 0;
    SET @outIdServicio = 0;

    BEGIN TRY
        DECLARE @IdTipoServicioInsert INT = NULL;
        IF @inIdTipoServicio > 0
            SET @IdTipoServicioInsert = @inIdTipoServicio;
            
        DECLARE @NombreLibreInsert VARCHAR(100) = NULL;
        IF @inIdTipoServicio = 0 OR @inIdTipoServicio IS NULL
            SET @NombreLibreInsert = @inNombreLibre;

        INSERT INTO dbo.Servicio (IdTipoServicio, NombreLibre, Fecha, Monto)
        VALUES (@IdTipoServicioInsert, @NombreLibreInsert, @inFecha, @inMonto);

        SET @outIdServicio = SCOPE_IDENTITY();
    END TRY
    BEGIN CATCH
        SET @outResultCode = 50000 + ERROR_NUMBER();
    END CATCH;
END;
GO

-- ════════════════════════════════════════════════════════════════
-- 3. sp_ObtenerHistorialServicios
-- ════════════════════════════════════════════════════════════════
IF OBJECT_ID('dbo.sp_ObtenerHistorialServicios', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_ObtenerHistorialServicios;
GO

CREATE PROCEDURE dbo.sp_ObtenerHistorialServicios
    @outResultCode INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET @outResultCode = 0;

    BEGIN TRY
        SELECT
            s.Id,
            s.Fecha,
            ts.Nombre AS TipoServicio,
            s.NombreLibre,
            s.Monto
        FROM dbo.Servicio s
        LEFT JOIN dbo.TipoServicio ts ON ts.Id = s.IdTipoServicio
        ORDER BY s.Fecha DESC;
    END TRY
    BEGIN CATCH
        SET @outResultCode = 50000 + ERROR_NUMBER();
    END CATCH;
END;
GO

PRINT '✓ Stored procedures para servicios creados exitosamente.';
GO
