using System.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;

namespace Backend.Controllers;

[ApiController]
[Route("api/historial")]
public class HistorialController(IConfiguration config) : ControllerBase
{
    /// <summary>
    /// Obtiene el historial unificado de transacciones desde la vista vw_Historial.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        string connStr = config.GetConnectionString("DefaultConnection")!;

        try
        {
            await using var conn = new SqlConnection(connStr);
            await conn.OpenAsync();

            await using var cmd = new SqlCommand("dbo.sp_ListarHistorial", conn)
            {
                CommandType = CommandType.StoredProcedure
            };

            var reader = await cmd.ExecuteReaderAsync();
            var historial = new List<object>();

            while (await reader.ReadAsync())
            {
                historial.Add(new
                {
                    tipoTransaccion = reader.GetString(reader.GetOrdinal("TipoTransaccion")),
                    idReferencia = reader.GetInt32(reader.GetOrdinal("IdReferencia")),
                    fecha = reader.GetDateTime(reader.GetOrdinal("Fecha")),
                    monto = reader.GetDecimal(reader.GetOrdinal("Monto")),
                    esAdquisicion = reader.GetInt32(reader.GetOrdinal("EsAdquisicion")) == 1
                });
            }

            return Ok(historial);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error al obtener historial.", detail = ex.Message });
        }
    }
}
