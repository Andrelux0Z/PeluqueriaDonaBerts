using System.Data;
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
        string connStr = config.GetConnectionString("DefaultConnection")!;

        try
        {
            await using var conn = new SqlConnection(connStr);
            await conn.OpenAsync();

            await using var cmd = new SqlCommand("dbo.sp_ListarProductos", conn)
            {
                CommandType = CommandType.StoredProcedure
            };

            var reader = await cmd.ExecuteReaderAsync();
            var productos = new List<object>();

            while (await reader.ReadAsync())
            {
                productos.Add(new
                {
                    id = reader.GetInt32(reader.GetOrdinal("Id")),
                    nombre = reader.GetString(reader.GetOrdinal("Nombre")),
                    cantidad = reader.GetInt32(reader.GetOrdinal("Cantidad")),
                    precio = reader.GetDecimal(reader.GetOrdinal("Precio")),
                    stockMinimo = reader.GetInt32(reader.GetOrdinal("StockMinimo"))
                });
            }

            return Ok(productos);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error al obtener productos.", detail = ex.Message });
        }
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
