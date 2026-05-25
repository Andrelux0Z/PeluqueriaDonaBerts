/* ================================================================
   03 – DATOS DE PRUEBA
   Inserta datos inventados para poder probar el sistema.
   Ejecutar DESPUÉS de 02_create_tables.sql.
   ================================================================ */

-- ════════════════════════════════════════════════════════════════
-- CATÁLOGOS
-- ════════════════════════════════════════════════════════════════

-- Categorías de productos
INSERT INTO dbo.CategoriaProducto (Nombre) VALUES
    ('Shampoos'),
    ('Acondicionadores'),
    ('Tintes y color'),
    ('Herramientas'),
    ('Accesorios');
GO

-- Tipos de servicio
INSERT INTO dbo.TipoServicio (Nombre, Precio) VALUES
    ('Corte de cabello',        5000.00),
    ('Corte y lavado',          7500.00),
    ('Tinte completo',         15000.00),
    ('Mechas / Rayitos',       20000.00),
    ('Alisado permanente',     25000.00),
    ('Peinado para evento',    12000.00),
    ('Tratamiento capilar',     8000.00),
    ('Barba y bigote',          3500.00);
GO

-- ════════════════════════════════════════════════════════════════
-- PRODUCTOS
-- ════════════════════════════════════════════════════════════════

INSERT INTO dbo.Producto (IdCategoria, Codigo, Nombre, PrecioVenta, Stock, StockMinimo) VALUES
    -- Shampoos (cat 1)
    (1, 'SH-001', 'Shampoo Anticaída Recamier',       4500.00,  12, 5),
    (1, 'SH-002', 'Shampoo Nutrición Profunda L''Oréal', 6200.00, 8, 5),
    (1, 'SH-003', 'Shampoo Matizador Violeta',         5800.00,  3, 5),  -- stock bajo

    -- Acondicionadores (cat 2)
    (2, 'AC-001', 'Acondicionador Hidratante Pantene',  3800.00,  15, 5),
    (2, 'AC-002', 'Mascarilla Reparadora Schwarzkopf',  7200.00,  2, 5),  -- stock bajo

    -- Tintes (cat 3)
    (3, 'TN-001', 'Tinte Rubio Dorado #7.3',           4200.00,  20, 10),
    (3, 'TN-002', 'Tinte Castaño Oscuro #3.0',         4200.00,  18, 10),
    (3, 'TN-003', 'Decolorante en Polvo 500g',         8500.00,   6, 5),
    (3, 'TN-004', 'Peróxido 20 Vol. 1L',               3200.00,  10, 5),
    (3, 'TN-005', 'Tinte Fantasía Rojo Fuego',         5500.00,   4, 5),  -- stock bajo

    -- Herramientas (cat 4)
    (4, 'HR-001', 'Tijera Profesional 6"',             18000.00,   5, 2),
    (4, 'HR-002', 'Capa para Corte Negra',              4500.00,   8, 3),
    (4, 'HR-003', 'Peine Cola Carbón',                  1500.00,  25, 10),

    -- Accesorios (cat 5)
    (5, 'ACC-001', 'Pinzas para Cabello (paq 12)',      2200.00,  30, 10),
    (5, 'ACC-002', 'Gorro Térmico para Tinte',          3500.00,   7, 3),
    (5, 'ACC-003', 'Guantes de Nitrilo Caja 100u',      6800.00,   1, 3);  -- stock bajo
GO

-- ════════════════════════════════════════════════════════════════
-- PROVEEDORES
-- ════════════════════════════════════════════════════════════════

INSERT INTO dbo.Proveedor (Nombre, Telefono, Email) VALUES
    ('Distribuidora Capilux',     '2222-1111', 'ventas@capilux.cr'),
    ('Productos Bela Costa Rica', '2233-4455', 'pedidos@bela.cr'),
    ('ImportaCR Belleza',         '8899-0011', NULL),
    ('Salón Supply CR',           '2244-6677', 'info@salonsupply.cr');
GO

-- ════════════════════════════════════════════════════════════════
-- COMPRAS (con sus detalles)
-- ════════════════════════════════════════════════════════════════

-- Compra #1 → Proveedor "Distribuidora Capilux"
INSERT INTO dbo.Compra (IdProveedor, Fecha, Notas) VALUES
    (1, '2026-05-10 09:00:00', 'Reposición mensual de shampoos');
GO

INSERT INTO dbo.DetalleCompra (IdCompra, IdProducto, Cantidad, PrecioUnit, Descuento) VALUES
    (1, 1, 10, 3200.00, 0),     -- 10x Shampoo Anticaída @ ₡3200
    (1, 2,  5, 4500.00, 5),     -- 5x Shampoo Nutrición @ ₡4500, 5% desc
    (1, 4, 10, 2800.00, 0);     -- 10x Acondicionador Pantene @ ₡2800
GO

-- Compra #2 → Proveedor "Productos Bela"
INSERT INTO dbo.Compra (IdProveedor, Fecha, Notas) VALUES
    (2, '2026-05-15 10:30:00', 'Tintes para el mes');
GO

INSERT INTO dbo.DetalleCompra (IdCompra, IdProducto, Cantidad, PrecioUnit, Descuento) VALUES
    (2, 6, 15, 3000.00, 10),    -- 15x Tinte Rubio @ ₡3000, 10% desc
    (2, 7, 12, 3000.00, 10),    -- 12x Tinte Castaño @ ₡3000, 10% desc
    (2, 8,  4, 6000.00, 0),     -- 4x Decolorante @ ₡6000
    (2, 9,  8, 2200.00, 0);     -- 8x Peróxido @ ₡2200
GO

-- Compra #3 → Proveedor "Salón Supply CR"
INSERT INTO dbo.Compra (IdProveedor, Fecha, Notas) VALUES
    (4, '2026-05-18 14:00:00', 'Herramientas y accesorios');
GO

INSERT INTO dbo.DetalleCompra (IdCompra, IdProducto, Cantidad, PrecioUnit, Descuento) VALUES
    (3, 11, 2, 14000.00, 0),    -- 2x Tijera Profesional @ ₡14000
    (3, 13, 20, 1000.00, 15),   -- 20x Peine Cola @ ₡1000, 15% desc
    (3, 16,  5, 5000.00, 0);    -- 5x Guantes Nitrilo @ ₡5000
GO

-- ════════════════════════════════════════════════════════════════
-- VENTAS (con sus detalles)
-- ════════════════════════════════════════════════════════════════

-- Venta #1: Cliente compra productos de cuidado
INSERT INTO dbo.Venta (Fecha, Notas) VALUES
    ('2026-05-19 11:00:00', 'Clienta María – productos para casa');
GO

INSERT INTO dbo.DetalleVenta (IdVenta, IdProducto, Cantidad, PrecioUnit, Descuento) VALUES
    (1, 1, 1, 4500.00, 0),     -- 1x Shampoo Anticaída
    (1, 4, 1, 3800.00, 0),     -- 1x Acondicionador Pantene
    (1, 5, 1, 7200.00, 10);    -- 1x Mascarilla Schwarzkopf, 10% desc
GO

-- Venta #2: Venta de tintes
INSERT INTO dbo.Venta (Fecha, Notas) VALUES
    ('2026-05-20 15:30:00', 'Clienta Laura – tinte para llevar');
GO

INSERT INTO dbo.DetalleVenta (IdVenta, IdProducto, Cantidad, PrecioUnit, Descuento) VALUES
    (2, 6, 2, 4200.00, 0),     -- 2x Tinte Rubio
    (2, 9, 1, 3200.00, 0);     -- 1x Peróxido
GO

-- Venta #3: Venta pequeña de accesorios
INSERT INTO dbo.Venta (Fecha, Notas) VALUES
    ('2026-05-21 09:45:00', NULL);
GO

INSERT INTO dbo.DetalleVenta (IdVenta, IdProducto, Cantidad, PrecioUnit, Descuento) VALUES
    (3, 14, 2, 2200.00, 0),    -- 2x Pinzas para Cabello
    (3, 13, 3, 1500.00, 0);    -- 3x Peine Cola Carbón
GO

-- Venta #4: Venta con descuento
INSERT INTO dbo.Venta (Fecha, Notas) VALUES
    ('2026-05-22 10:00:00', 'Promo de la semana');
GO

INSERT INTO dbo.DetalleVenta (IdVenta, IdProducto, Cantidad, PrecioUnit, Descuento) VALUES
    (4, 2, 1, 6200.00, 15),    -- 1x Shampoo L'Oréal, 15% desc
    (4, 10, 1, 5500.00, 20),   -- 1x Tinte Fantasía, 20% desc
    (4, 15, 1, 3500.00, 0);    -- 1x Gorro Térmico
GO

-- ════════════════════════════════════════════════════════════════
-- SERVICIOS
-- ════════════════════════════════════════════════════════════════

-- Servicios con tipo preestablecido
INSERT INTO dbo.Servicio (IdTipoServicio, NombreLibre, Fecha, Monto) VALUES
    (1, NULL, '2026-05-19 09:30:00', 5000.00),     -- Corte de cabello
    (2, NULL, '2026-05-19 10:15:00', 7500.00),     -- Corte y lavado
    (3, NULL, '2026-05-19 11:30:00', 15000.00),    -- Tinte completo
    (1, NULL, '2026-05-19 14:00:00', 5000.00),     -- Corte de cabello
    (8, NULL, '2026-05-19 14:45:00', 3500.00),     -- Barba y bigote
    (4, NULL, '2026-05-20 09:00:00', 20000.00),    -- Mechas
    (6, NULL, '2026-05-20 11:00:00', 12000.00),    -- Peinado para evento
    (1, NULL, '2026-05-20 15:00:00', 5000.00),     -- Corte de cabello
    (7, NULL, '2026-05-21 10:00:00', 8000.00),     -- Tratamiento capilar
    (5, NULL, '2026-05-21 13:00:00', 25000.00),    -- Alisado permanente
    (2, NULL, '2026-05-22 09:00:00', 7500.00),     -- Corte y lavado
    (1, NULL, '2026-05-22 10:30:00', 5000.00);     -- Corte de cabello
GO

-- Servicios con nombre libre (sin tipo preestablecido)
INSERT INTO dbo.Servicio (IdTipoServicio, NombreLibre, Fecha, Monto) VALUES
    (NULL, 'Trenzas africanas',          '2026-05-20 16:00:00', 18000.00),
    (NULL, 'Extensiones clip-in',        '2026-05-21 15:30:00', 35000.00),
    (NULL, 'Depilación cejas con hilo',  '2026-05-22 11:00:00', 4000.00);
GO

-- ════════════════════════════════════════════════════════════════
-- VERIFICACIÓN RÁPIDA
-- ════════════════════════════════════════════════════════════════

PRINT '──────────────────────────────────────────';
PRINT 'Datos insertados. Resumen:';
PRINT '──────────────────────────────────────────';

SELECT 'CategoriaProducto' AS Tabla, COUNT(*) AS Filas FROM dbo.CategoriaProducto
UNION ALL SELECT 'TipoServicio',     COUNT(*) FROM dbo.TipoServicio
UNION ALL SELECT 'Producto',         COUNT(*) FROM dbo.Producto
UNION ALL SELECT 'Proveedor',        COUNT(*) FROM dbo.Proveedor
UNION ALL SELECT 'Compra',           COUNT(*) FROM dbo.Compra
UNION ALL SELECT 'DetalleCompra',    COUNT(*) FROM dbo.DetalleCompra
UNION ALL SELECT 'Venta',            COUNT(*) FROM dbo.Venta
UNION ALL SELECT 'DetalleVenta',     COUNT(*) FROM dbo.DetalleVenta
UNION ALL SELECT 'Servicio',        COUNT(*) FROM dbo.Servicio;

PRINT '';
PRINT '── Vista vw_Historial (preview) ──';
SELECT TOP 10 * FROM dbo.vw_Historial ORDER BY Fecha DESC;

PRINT '';
PRINT '── Productos con stock bajo ──';
SELECT Codigo, Nombre, Stock, StockMinimo
FROM dbo.Producto
WHERE Stock <= StockMinimo AND EsActivo = 1;

GO
