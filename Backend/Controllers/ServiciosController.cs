using System.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;

namespace Backend.Controllers;

[ApiController]
[Route("api/servicios")]
public class ServiciosController(IConfiguration config) : ControllerBase
{
    /// <summary>
    /// Obtiene todos los servicios registrados.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        string connStr = config.GetConnectionString("DefaultConnection")!;

        try
        {
            await using var conn = new SqlConnection(connStr);
            await conn.OpenAsync();

            await using var cmd = new SqlCommand("dbo.sp_ListarServicios", conn)
            {
                CommandType = CommandType.StoredProcedure
            };

            var reader = await cmd.ExecuteReaderAsync();
            var servicios = new List<object>();

            while (await reader.ReadAsync())
            {
                servicios.Add(new
                {
                    id = reader.GetInt32(reader.GetOrdinal("Id")),
                    nombre = reader.GetString(reader.GetOrdinal("Nombre")),
                    fecha = reader.GetDateTime(reader.GetOrdinal("Fecha")),
                    monto = reader.GetDecimal(reader.GetOrdinal("Monto"))
                });
            }

            return Ok(servicios);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error al obtener servicios.", detail = ex.Message });
        }
    }

    /// <summary>
    /// Obtiene los tipos de servicio para el dropdown.
    /// </summary>
    [HttpGet("tipos")]
    public async Task<IActionResult> GetTipos()
    {
        string connStr = config.GetConnectionString("DefaultConnection")!;

        try
        {
            await using var conn = new SqlConnection(connStr);
            await conn.OpenAsync();

            await using var cmd = new SqlCommand(
                "SELECT Id, Nombre, Precio FROM dbo.TipoServicio WHERE EsActivo = 1 ORDER BY Nombre", conn);

            var reader = await cmd.ExecuteReaderAsync();
            var tipos = new List<object>();

            while (await reader.ReadAsync())
            {
                tipos.Add(new
                {
                    id = reader.GetInt32(0),
                    nombre = reader.GetString(1),
                    precio = reader.GetDecimal(2)
                });
            }

            return Ok(tipos);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error al obtener tipos de servicio.", detail = ex.Message });
        }
    }

    /// <summary>
    /// Registra un nuevo servicio.
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] ServicioRequest request)
    {
        string connStr = config.GetConnectionString("DefaultConnection")!;

        try
        {
            await using var conn = new SqlConnection(connStr);
            await conn.OpenAsync();

            await using var cmd = new SqlCommand("dbo.sp_InsertarServicio", conn)
            {
                CommandType = CommandType.StoredProcedure
            };

            if (request.IdTipoServicio.HasValue)
                cmd.Parameters.AddWithValue("@inIdTipoServicio", request.IdTipoServicio.Value);
            else
                cmd.Parameters.AddWithValue("@inIdTipoServicio", DBNull.Value);

            if (!string.IsNullOrEmpty(request.NombreLibre))
                cmd.Parameters.AddWithValue("@inNombreLibre", request.NombreLibre);
            else
                cmd.Parameters.AddWithValue("@inNombreLibre", DBNull.Value);

            cmd.Parameters.AddWithValue("@inMonto", request.Monto);

            var pResultCode = new SqlParameter("@outResultCode", SqlDbType.Int) { Direction = ParameterDirection.Output };
            cmd.Parameters.Add(pResultCode);

            await cmd.ExecuteNonQueryAsync();

            int resultCode = (int)pResultCode.Value;

            if (resultCode != 0)
                return BadRequest(new { message = "Error al registrar el servicio.", code = resultCode });

            return Ok(new { message = "Servicio registrado exitosamente." });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error al registrar el servicio.", detail = ex.Message });
        }
    }

    /// <summary>
    /// Elimina un servicio.
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        string connStr = config.GetConnectionString("DefaultConnection")!;

        try
        {
            await using var conn = new SqlConnection(connStr);
            await conn.OpenAsync();

            await using var cmd = new SqlCommand("dbo.sp_EliminarServicio", conn)
            {
                CommandType = CommandType.StoredProcedure
            };

            cmd.Parameters.AddWithValue("@inId", id);

            var pResultCode = new SqlParameter("@outResultCode", SqlDbType.Int) { Direction = ParameterDirection.Output };
            cmd.Parameters.Add(pResultCode);

            await cmd.ExecuteNonQueryAsync();

            int resultCode = (int)pResultCode.Value;

            if (resultCode != 0)
                return BadRequest(new { message = "Error al eliminar el servicio.", code = resultCode });

            return Ok(new { message = "Servicio eliminado exitosamente." });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error al eliminar el servicio.", detail = ex.Message });
        }
    }
}

public class ServicioRequest
{
    public int? IdTipoServicio { get; set; }
    public string? NombreLibre { get; set; }
    public decimal Monto { get; set; }
}
