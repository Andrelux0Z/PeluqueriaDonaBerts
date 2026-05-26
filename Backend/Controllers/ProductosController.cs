using System.Data;
using Backend.DTOs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;

namespace Backend.Controllers;

[ApiController]
[Route("api/productos")]
public class ProductosController(IConfiguration config) : ControllerBase
{
    /// <summary>
    /// Obtiene todos los productos activos del inventario.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        try
        {
            var productos = await ObtenerProductosAsync("dbo.sp_ListarProductos");
            return Ok(productos);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error al obtener productos.", detail = ex.Message });
        }
    }

    /// <summary>
    /// Filtra productos por nombre, código, precio o cantidad.
    /// </summary>
    [HttpGet("filtrar")]
    public async Task<IActionResult> Filtrar([FromQuery] FiltroProductosQueryDto filtro)
    {
        if (!filtro.TieneAlgunCriterio)
        {
            return BadRequest(new
            {
                message = "Debe ingresar al menos un criterio de búsqueda."
            });
        }

        if (filtro.PrecioMin.HasValue && filtro.PrecioMax.HasValue && filtro.PrecioMin > filtro.PrecioMax)
        {
            return BadRequest(new
            {
                message = "El rango de precio es inválido: el mínimo no puede ser mayor que el máximo."
            });
        }

        if (filtro.CantidadMin.HasValue && filtro.CantidadMax.HasValue && filtro.CantidadMin > filtro.CantidadMax)
        {
            return BadRequest(new
            {
                message = "El rango de cantidad es inválido: el mínimo no puede ser mayor que el máximo."
            });
        }

        try
        {
            var productos = await ObtenerProductosAsync(
                "dbo.sp_FiltrarProductos",
                cmd =>
                {
                    AgregarParametroCadena(cmd, "@inNombre", filtro.Nombre);
                    AgregarParametroCadena(cmd, "@inCodigo", filtro.Codigo);
                    AgregarParametroDecimal(cmd, "@inPrecioMin", filtro.PrecioMin);
                    AgregarParametroDecimal(cmd, "@inPrecioMax", filtro.PrecioMax);
                    AgregarParametroEntero(cmd, "@inCantidadMin", filtro.CantidadMin);
                    AgregarParametroEntero(cmd, "@inCantidadMax", filtro.CantidadMax);
                });

            if (productos.Count == 0)
            {
                return Ok(new
                {
                    message = "No se encontraron productos con los filtros aplicados.",
                    productos
                });
            }

            return Ok(productos);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error al filtrar productos.", detail = ex.Message });
        }
    }

    private async Task<List<ProductoDto>> ObtenerProductosAsync(
        string storedProcedure,
        Action<SqlCommand>? configurarParametros = null)
    {
        string connStr = config.GetConnectionString("DefaultConnection")!;

        await using var conn = new SqlConnection(connStr);
        await conn.OpenAsync();

        await using var cmd = new SqlCommand(storedProcedure, conn)
        {
            CommandType = CommandType.StoredProcedure
        };

        configurarParametros?.Invoke(cmd);

        await using var reader = await cmd.ExecuteReaderAsync();
        var productos = new List<ProductoDto>();

        while (await reader.ReadAsync())
        {
            productos.Add(new ProductoDto
            {
                Id = reader.GetInt32(reader.GetOrdinal("Id")),
                Codigo = reader.GetString(reader.GetOrdinal("Codigo")),
                Nombre = reader.GetString(reader.GetOrdinal("Nombre")),
                Cantidad = reader.GetInt32(reader.GetOrdinal("Cantidad")),
                Precio = reader.GetDecimal(reader.GetOrdinal("Precio")),
                StockMinimo = reader.GetInt32(reader.GetOrdinal("StockMinimo"))
            });
        }

        return productos;
    }

    private static void AgregarParametroCadena(SqlCommand cmd, string nombreParametro, string? valor)
    {
        cmd.Parameters.AddWithValue(
            nombreParametro,
            string.IsNullOrWhiteSpace(valor) ? DBNull.Value : valor.Trim());
    }

    private static void AgregarParametroDecimal(SqlCommand cmd, string nombreParametro, decimal? valor)
    {
        cmd.Parameters.AddWithValue(nombreParametro, valor.HasValue ? valor.Value : DBNull.Value);
    }

    private static void AgregarParametroEntero(SqlCommand cmd, string nombreParametro, int? valor)
    {
        cmd.Parameters.AddWithValue(nombreParametro, valor.HasValue ? valor.Value : DBNull.Value);
    }

    /// <summary>
    /// Crea un nuevo producto en el inventario.
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] ProductoRequest request)
    {
        string connStr = config.GetConnectionString("DefaultConnection")!;

        try
        {
            await using var conn = new SqlConnection(connStr);
            await conn.OpenAsync();

            await using var cmd = new SqlCommand("dbo.sp_InsertarProducto", conn)
            {
                CommandType = CommandType.StoredProcedure
            };

            cmd.Parameters.AddWithValue("@inNombre", request.Nombre);
            cmd.Parameters.AddWithValue("@inCantidad", request.Cantidad);
            cmd.Parameters.AddWithValue("@inPrecio", request.Precio);
            cmd.Parameters.AddWithValue("@inStockMinimo", request.StockMinimo);

            var pResultCode = new SqlParameter("@outResultCode", SqlDbType.Int) { Direction = ParameterDirection.Output };
            cmd.Parameters.Add(pResultCode);

            await cmd.ExecuteNonQueryAsync();

            int resultCode = (int)pResultCode.Value;

            if (resultCode != 0)
                return BadRequest(new { message = "Error al crear el producto.", code = resultCode });

            return Ok(new { message = "Producto creado exitosamente." });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error al crear el producto.", detail = ex.Message });
        }
    }

    /// <summary>
    /// Actualiza un producto existente.
    /// </summary>
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] ProductoRequest request)
    {
        string connStr = config.GetConnectionString("DefaultConnection")!;

        try
        {
            await using var conn = new SqlConnection(connStr);
            await conn.OpenAsync();

            await using var cmd = new SqlCommand("dbo.sp_ActualizarProducto", conn)
            {
                CommandType = CommandType.StoredProcedure
            };

            cmd.Parameters.AddWithValue("@inId", id);
            cmd.Parameters.AddWithValue("@inNombre", request.Nombre);
            cmd.Parameters.AddWithValue("@inCantidad", request.Cantidad);
            cmd.Parameters.AddWithValue("@inPrecio", request.Precio);
            cmd.Parameters.AddWithValue("@inStockMinimo", request.StockMinimo);

            var pResultCode = new SqlParameter("@outResultCode", SqlDbType.Int) { Direction = ParameterDirection.Output };
            cmd.Parameters.Add(pResultCode);

            await cmd.ExecuteNonQueryAsync();

            int resultCode = (int)pResultCode.Value;

            if (resultCode != 0)
                return BadRequest(new { message = "Error al actualizar el producto.", code = resultCode });

            return Ok(new { message = "Producto actualizado exitosamente." });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error al actualizar el producto.", detail = ex.Message });
        }
    }

    /// <summary>
    /// Registra una compra de producto (IP-006), actualiza stock.
    /// </summary>
    [HttpPost("compras")]
    public async Task<IActionResult> RegistrarCompra([FromBody] RegistrarCompraRequestDto request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        decimal montoBase = request.Cantidad * request.PrecioUnit;
        string tipoDescuento = string.IsNullOrWhiteSpace(request.TipoDescuento)
            ? "PORCENTAJE"
            : request.TipoDescuento.Trim().ToUpperInvariant();
        decimal valorDescuento = request.AplicaDescuento ? request.ValorDescuento : 0;

        if (request.AplicaDescuento)
        {
            if (tipoDescuento is not ("PORCENTAJE" or "FIJO"))
                return BadRequest(new { message = "El tipo de descuento no es válido." });

            if (tipoDescuento == "PORCENTAJE" && (valorDescuento < 0 || valorDescuento > 100))
                return BadRequest(new { message = "El porcentaje de descuento debe estar entre 0 y 100." });

            if (tipoDescuento == "FIJO" && valorDescuento > montoBase)
                return BadRequest(new { message = "El monto fijo del descuento no puede ser mayor al total de la compra." });
        }
        else
        {
            tipoDescuento = "PORCENTAJE";
            valorDescuento = 0;
        }

        string connStr = config.GetConnectionString("DefaultConnection")!;

        try
        {
            await using var conn = new SqlConnection(connStr);
            await conn.OpenAsync();

            await using var cmd = new SqlCommand("dbo.sp_RegistrarCompra", conn)
            {
                CommandType = CommandType.StoredProcedure
            };

            cmd.Parameters.AddWithValue("@inIdProducto",  request.IdProducto);
            cmd.Parameters.AddWithValue("@inCantidad",    request.Cantidad);
            cmd.Parameters.AddWithValue("@inPrecioUnit",  request.PrecioUnit);
            cmd.Parameters.AddWithValue("@inTipoDescuento", tipoDescuento);
            cmd.Parameters.AddWithValue("@inDescuento",   valorDescuento);
            cmd.Parameters.AddWithValue("@inNotas",       (object?)request.Notas ?? DBNull.Value);

            var pIdCompra   = new SqlParameter("@outIdCompra",    SqlDbType.Int) { Direction = ParameterDirection.Output };
            var pResultCode = new SqlParameter("@outResultCode",  SqlDbType.Int) { Direction = ParameterDirection.Output };
            cmd.Parameters.Add(pIdCompra);
            cmd.Parameters.Add(pResultCode);

            await cmd.ExecuteNonQueryAsync();

            int resultCode = (int)pResultCode.Value;
            return resultCode switch
            {
                0 => CreatedAtAction(nameof(GetAll),
                        new { id = (int)pIdCompra.Value },
                        new { id = (int)pIdCompra.Value, message = "Compra registrada correctamente." }),
                1 => NotFound(new  { message = "El producto no existe o está inactivo." }),
                2 => BadRequest(new { message = "La cantidad debe ser mayor a cero." }),
                3 => BadRequest(new { message = "El precio unitario no puede ser negativo." }),
                4 => BadRequest(new { message = "El porcentaje de descuento debe estar entre 0 y 100." }),
                5 => BadRequest(new { message = "El monto fijo del descuento no puede ser mayor al total de la compra." }),
                6 => BadRequest(new { message = "El tipo de descuento no es válido." }),
                _ => StatusCode(500, new { message = "Error al registrar la compra." })
            };
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error de conexión con la base de datos.", detail = ex.Message });
        }
    }

    /// <summary>
    /// Elimina (desactiva) un producto.
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        string connStr = config.GetConnectionString("DefaultConnection")!;

        try
        {
            await using var conn = new SqlConnection(connStr);
            await conn.OpenAsync();

            await using var cmd = new SqlCommand("dbo.sp_EliminarProducto", conn)
            {
                CommandType = CommandType.StoredProcedure
            };

            cmd.Parameters.AddWithValue("@inId", id);

            var pResultCode = new SqlParameter("@outResultCode", SqlDbType.Int) { Direction = ParameterDirection.Output };
            cmd.Parameters.Add(pResultCode);

            await cmd.ExecuteNonQueryAsync();

            int resultCode = (int)pResultCode.Value;

            if (resultCode != 0)
                return BadRequest(new { message = "Error al eliminar el producto.", code = resultCode });

            return Ok(new { message = "Producto eliminado exitosamente." });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error al eliminar el producto.", detail = ex.Message });
        }
    }
}

/// <summary>
/// DTO para las peticiones de crear/actualizar producto.
/// </summary>
public class ProductoRequest
{
    public string Nombre { get; set; } = string.Empty;
    public int Cantidad { get; set; }
    public decimal Precio { get; set; }
    public int StockMinimo { get; set; } = 5;
}
