/* ================================================================
   07 – Agregar rol EmpleadoBasico a la tabla Usuario
   ================================================================ */

-- Buscar y eliminar el CHECK constraint actual sobre Rol (si existe)
DECLARE @constraintName NVARCHAR(256);

SELECT @constraintName = cc.name
FROM sys.check_constraints cc
JOIN sys.columns c ON cc.parent_object_id = c.object_id
                   AND cc.parent_column_id = c.column_id
WHERE cc.parent_object_id = OBJECT_ID('dbo.Usuario')
  AND c.name = 'Rol';

IF @constraintName IS NOT NULL
    EXEC('ALTER TABLE dbo.Usuario DROP CONSTRAINT [' + @constraintName + ']');

-- Agregar nuevo constraint que incluye EmpleadoBasico
ALTER TABLE dbo.Usuario
ADD CONSTRAINT CK_Usuario_Rol
    CHECK (Rol IN ('Admin', 'Empleado', 'EmpleadoBasico'));
GO
