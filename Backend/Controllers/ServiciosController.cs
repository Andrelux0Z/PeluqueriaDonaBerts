using System.Data;
using Backend.DTOs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;

namespace Backend.Controllers;

[ApiController]
[Route("api/servicios")]
public class ServiciosController(IConfiguration config) : ControllerBase
{
    private readonly string _connStr = config.GetConnectionString("DefaultConnection")!;

    [HttpPost]
    public IActionResult RegistrarServicio([FromBody] RegistrarServicioRequestDto request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        if (request.Fecha == default)
            return BadRequest(new { message = "La fecha no es válida." });

        if (request.MontoCobrado < 0)
            return BadRequest(new { message = "El monto no puede ser negativo." });

        try
        {
            string remoteIp = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";

            using var conn = new SqlConnection(_connStr);
            conn.Open();
            using var cmd = new SqlCommand("dbo.sp_RegistrarServicio", conn)
            {
                CommandType = CommandType.StoredProcedure
            };

            cmd.Parameters.AddWithValue("@inIdTipoServicio", request.IdConfiguracion ?? 0);
            cmd.Parameters.AddWithValue("@inNombreLibre", request.Descripcion);
            cmd.Parameters.AddWithValue("@inFecha", request.Fecha);
            cmd.Parameters.AddWithValue("@inMonto", request.MontoCobrado);
            cmd.Parameters.AddWithValue("@inIdPostByUser", request.IdPostByUser ?? 0);
            cmd.Parameters.AddWithValue("@inIpPostIn", remoteIp);

            var pResultCode = new SqlParameter("@outResultCode", SqlDbType.Int) { Direction = ParameterDirection.Output };
            var pIdServicio  = new SqlParameter("@outIdServicio",  SqlDbType.Int) { Direction = ParameterDirection.Output };
            cmd.Parameters.Add(pResultCode);
            cmd.Parameters.Add(pIdServicio);

            cmd.ExecuteNonQuery();

            int resultCode = (int)pResultCode.Value;
            if (resultCode != 0)
                return StatusCode(500, new { message = "Error al registrar el servicio en la base de datos." });

            int idServicio = (int)pIdServicio.Value;
            return CreatedAtAction(nameof(RegistrarServicio), new { id = idServicio, message = "Servicio registrado correctamente." });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error de conexión con la base de datos.", error = ex.Message });
        }
    }

    [HttpGet]
    public IActionResult ObtenerHistorial()
    {
        try
        {
            using var conn = new SqlConnection(_connStr);
            conn.Open();
            using var cmd = new SqlCommand("dbo.sp_ObtenerHistorialServicios", conn)
            {
                CommandType = CommandType.StoredProcedure
            };

            var pResultCode = new SqlParameter("@outResultCode", SqlDbType.Int) { Direction = ParameterDirection.Output };
            cmd.Parameters.Add(pResultCode);

            var servicios = new List<ServicioResponseDto>();
            using var reader = cmd.ExecuteReader();
            while (reader.Read())
            {
                servicios.Add(new ServicioResponseDto
                {
                    Id           = reader.GetInt32(reader.GetOrdinal("Id")),
                    Fecha        = reader.GetDateTime(reader.GetOrdinal("Fecha")),
                    TipoServicio = reader.IsDBNull(reader.GetOrdinal("TipoServicio")) ? "" : reader.GetString(reader.GetOrdinal("TipoServicio")),
                    NombreLibre  = reader.IsDBNull(reader.GetOrdinal("NombreLibre")) ? "" : reader.GetString(reader.GetOrdinal("NombreLibre")),
                    Monto        = reader.GetDecimal(reader.GetOrdinal("Monto"))
                });
            }

            reader.Close();
            int resultCode = (int)pResultCode.Value;
            if (resultCode != 0)
                return StatusCode(500, new { message = "Error al obtener el historial de servicios." });

            return Ok(servicios);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error de conexión con la base de datos.", error = ex.Message });
        }
    }

    [HttpGet("configuraciones")]
    public IActionResult ObtenerConfiguraciones()
    {
        try
        {
            using var conn = new SqlConnection(_connStr);
            conn.Open();
            using var cmd = new SqlCommand("dbo.sp_ObtenerTiposServicio", conn)
            {
                CommandType = CommandType.StoredProcedure
            };

            var pResultCode = new SqlParameter("@outResultCode", SqlDbType.Int) { Direction = ParameterDirection.Output };
            cmd.Parameters.Add(pResultCode);

            var configuraciones = new List<object>();
            using var reader = cmd.ExecuteReader();
            while (reader.Read())
            {
                configuraciones.Add(new
                {
                    id             = reader.GetInt32(reader.GetOrdinal("Id")),
                    nombreServicio = reader.GetString(reader.GetOrdinal("NombreServicio")),
                    precioBase     = reader.GetDecimal(reader.GetOrdinal("PrecioBase"))
                });
            }

            reader.Close();
            int resultCode = (int)pResultCode.Value;
            if (resultCode != 0)
                return StatusCode(500, new { message = "Error al obtener las configuraciones de servicio." });

            return Ok(configuraciones);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error de conexión con la base de datos.", error = ex.Message });
        }
    }

    [HttpPost("configuraciones")]
    public IActionResult CrearTipoServicio([FromBody] CrearTipoServicioRequestDto request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        try
        {
            using var conn = new SqlConnection(_connStr);
            conn.Open();
            using var cmd = new SqlCommand("dbo.sp_CrearTipoServicio", conn)
            {
                CommandType = CommandType.StoredProcedure
            };

            cmd.Parameters.AddWithValue("@inNombre", request.NombreServicio.Trim());
            cmd.Parameters.AddWithValue("@inPrecio", request.PrecioBase);

            var pResultCode = new SqlParameter("@outResultCode", SqlDbType.Int) { Direction = ParameterDirection.Output };
            var pId         = new SqlParameter("@outId",         SqlDbType.Int) { Direction = ParameterDirection.Output };
            cmd.Parameters.Add(pResultCode);
            cmd.Parameters.Add(pId);

            cmd.ExecuteNonQuery();

            int resultCode = (int)pResultCode.Value;
            return resultCode switch
            {
                0 => CreatedAtAction(nameof(ObtenerConfiguraciones),
                        new { id = (int)pId.Value },
                        new { id = (int)pId.Value, message = "Tipo de servicio creado correctamente." }),
                1 => BadRequest(new { message = "El nombre del servicio no puede estar vacío." }),
                2 => BadRequest(new { message = "El precio base no puede ser negativo." }),
                3 => Conflict(new  { message = "Ya existe un tipo de servicio con ese nombre." }),
                _ => StatusCode(500, new { message = "Error al crear el tipo de servicio." })
            };
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error de conexión con la base de datos.", error = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    public IActionResult EliminarServicio(int id)
    {
        try
        {
            using var conn = new SqlConnection(_connStr);
            conn.Open();
            using var cmd = new SqlCommand("dbo.sp_EliminarServicio", conn)
            {
                CommandType = CommandType.StoredProcedure
            };

            cmd.Parameters.AddWithValue("@inId", id);

            var pResultCode = new SqlParameter("@outResultCode", SqlDbType.Int) { Direction = ParameterDirection.Output };
            cmd.Parameters.Add(pResultCode);

            cmd.ExecuteNonQuery();

            int resultCode = (int)pResultCode.Value;
            if (resultCode != 0)
                return StatusCode(500, new { message = "Error al eliminar el servicio desde la base de datos." });

            return Ok(new { message = "Servicio eliminado exitosamente." });
        }
        catch (Exception ex)
        {
             return StatusCode(500, new { message = "Error de conexión con la base de datos.", error = ex.Message });
        }
    }
}
