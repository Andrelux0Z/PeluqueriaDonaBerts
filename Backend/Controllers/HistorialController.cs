using System.Data;
using Backend.DTOs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;

namespace Backend.Controllers;

[ApiController]
[Route("api/historial")]
public class HistorialController(IConfiguration config) : ControllerBase
{
    /// <summary>
    /// Devuelve todo el historial sin aplicar filtros (lista completa ordenada por fecha desc).
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        try
        {
            var lista = await EjecutarSpListarHistorialAsync(new FiltroHistorialQueryDto());
            return Ok(lista);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error al obtener historial.", detail = ex.Message });
        }
    }

    /// <summary>
    /// Filtra el historial según criterios. Se usa para la acción de "Aplicar filtros" en frontend.
    /// Requiere al menos un criterio (igual que inventario).
    /// </summary>
    [HttpGet("filtrar")]
    public async Task<IActionResult> Filtrar([FromQuery] FiltroHistorialQueryDto filtro)
    {
        if (!filtro.TieneAlgunCriterio)
        {
            return BadRequest(new { message = "Debe ingresar al menos un criterio de búsqueda." });
        }

        if (filtro.FechaInicio.HasValue && filtro.FechaFin.HasValue && filtro.FechaInicio > filtro.FechaFin)
        {
            return BadRequest(new { message = "El rango de fechas es inválido: la fecha inicial no puede ser mayor que la final." });
        }

        if (filtro.MontoMin.HasValue && filtro.MontoMax.HasValue && filtro.MontoMin > filtro.MontoMax)
        {
            return BadRequest(new { message = "El rango de montos es inválido: el mínimo no puede ser mayor que el máximo." });
        }

        try
        {
            var lista = await EjecutarSpListarHistorialAsync(filtro);
            if (lista.Count == 0)
            {
                return Ok(new { message = "No hay transacciones que coincidan con los filtros aplicados.", historial = lista });
            }

            return Ok(lista);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error al filtrar historial.", detail = ex.Message });
        }
    }

    private async Task<List<object>> EjecutarSpListarHistorialAsync(FiltroHistorialQueryDto filtro)
    {
        string connStr = config.GetConnectionString("DefaultConnection")!;
        await using var conn = new SqlConnection(connStr);
        await conn.OpenAsync();

        await using var cmd = new SqlCommand("dbo.sp_ListarHistorial", conn)
        {
            CommandType = CommandType.StoredProcedure
        };

        AgregarParametroCadena(cmd, "@inTipoTransaccion", filtro.TipoTransaccion);
        AgregarParametroFecha(cmd, "@inFechaInicio", filtro.FechaInicio);
        AgregarParametroFecha(cmd, "@inFechaFin", filtro.FechaFin);
        AgregarParametroDecimal(cmd, "@inMontoMin", filtro.MontoMin);
        AgregarParametroDecimal(cmd, "@inMontoMax", filtro.MontoMax);
        AgregarParametroCadena(cmd, "@inNombreServicio", filtro.NombreServicio);

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
                esAdquisicion = reader.GetInt32(reader.GetOrdinal("EsAdquisicion")) == 1,
                nombreServicio = reader.IsDBNull(reader.GetOrdinal("NombreServicio"))
                    ? string.Empty
                    : reader.GetString(reader.GetOrdinal("NombreServicio"))
            });
        }

        return historial;
    }

    private static void AgregarParametroCadena(SqlCommand cmd, string nombreParametro, string? valor)
    {
        cmd.Parameters.AddWithValue(nombreParametro, string.IsNullOrWhiteSpace(valor) ? DBNull.Value : valor.Trim());
    }

    private static void AgregarParametroDecimal(SqlCommand cmd, string nombreParametro, decimal? valor)
    {
        cmd.Parameters.AddWithValue(nombreParametro, valor.HasValue ? valor.Value : DBNull.Value);
    }

    private static void AgregarParametroFecha(SqlCommand cmd, string nombreParametro, DateTime? valor)
    {
        cmd.Parameters.AddWithValue(nombreParametro, valor.HasValue ? valor.Value : DBNull.Value);
    }
}
