using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using System.Data;

namespace ProyectoBases2.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class LoginController : ControllerBase
    {
        private readonly string _connectionString;

        public LoginController(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection");
        }

        [HttpPost]
        public IActionResult Autenticar([FromBody] LoginRequest request)
        {
            try
            {
                // Obtenemos la IP de la conexión local o asignamos una por defecto
                string remoteIp = "127.0.0.1";
                if (HttpContext.Connection.RemoteIpAddress != null)
                {
                    remoteIp = HttpContext.Connection.RemoteIpAddress.ToString();
                }

                using (var connection = new SqlConnection(_connectionString))
                {
                    connection.Open();

                    using (var command = new SqlCommand("dbo.sp_Login", connection))
                    {
                        command.CommandType = CommandType.StoredProcedure;

                        command.Parameters.Add(new SqlParameter("@inUsuario", request.Usuario));
                        command.Parameters.Add(new SqlParameter("@inIpPostIn", remoteIp));

                        var outResultCode = new SqlParameter("@outResultCode", SqlDbType.Int) { Direction = ParameterDirection.Output };
                        var outIdUsuario = new SqlParameter("@outIdUsuario", SqlDbType.Int) { Direction = ParameterDirection.Output };
                        var outPasswordHash = new SqlParameter("@outPasswordHash", SqlDbType.VarChar, 255) { Direction = ParameterDirection.Output };
                        var outRol = new SqlParameter("@outRol", SqlDbType.VarChar, 20) { Direction = ParameterDirection.Output };

                        command.Parameters.Add(outResultCode);
                        command.Parameters.Add(outIdUsuario);
                        command.Parameters.Add(outPasswordHash);
                        command.Parameters.Add(outRol);

                        command.ExecuteNonQuery();

                        int resultCode = (int)outResultCode.Value;
                        int idUsuario = (int)outIdUsuario.Value;
                        string passwordHash = outPasswordHash.Value?.ToString() ?? string.Empty;
                        string rol = outRol.Value?.ToString() ?? string.Empty;

                        if (resultCode == 50001)
                            return BadRequest(new { success = false, message = "El usuario ingresado no existe." });

                        if (resultCode == 50003)
                            return BadRequest(new { success = false, message = "Cuenta bloqueada o inactiva. Contacte al administrador." });

                        if (resultCode != 0)
                            return BadRequest(new { success = false, message = "Error inesperado al iniciar sesión." });

                        var hashIngresado = Convert.ToHexString(
                            System.Security.Cryptography.SHA256.HashData(
                                System.Text.Encoding.UTF8.GetBytes(request.Password)));

                        if (!string.Equals(hashIngresado, passwordHash, StringComparison.OrdinalIgnoreCase))
                            return BadRequest(new { success = false, message = "Contraseña incorrecta." });

                        return Ok(new { success = true, idUsuario = idUsuario, rol = rol, message = "Inicio de sesión exitoso" });
                    }
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Error al conectar con la base de datos.", error = ex.Message });
            }
        }

        [HttpPost("logout")]
        public IActionResult Logout([FromBody] LogoutRequest request)
        {
            try
            {
                string remoteIp = "127.0.0.1";
                if (HttpContext.Connection.RemoteIpAddress != null)
                {
                    remoteIp = HttpContext.Connection.RemoteIpAddress.ToString();
                }

                using (var connection = new SqlConnection(_connectionString))
                {
                    connection.Open();
                    using (var command = new SqlCommand("dbo.sp_InsertarBitacoraEvento", connection))
                    {
                        command.CommandType = CommandType.StoredProcedure;
                        command.Parameters.Add(new SqlParameter("@inIdTipoEvento", 4));
                        command.Parameters.Add(new SqlParameter("@inDescripcion", ""));
                        command.Parameters.Add(new SqlParameter("@inIdPostByUser", request.IdUsuario));
                        command.Parameters.Add(new SqlParameter("@inIpPostIn", remoteIp));
                        var outResultCode = new SqlParameter("@outResultCode", SqlDbType.Int) { Direction = ParameterDirection.Output };
                        command.Parameters.Add(outResultCode);

                        command.ExecuteNonQuery();
                    }
                }

                return Ok(new { success = true });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Error al cerrar sesión", error = ex.Message });
            }
        }
    }

    public class LoginRequest
    {
        public string Usuario { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class LogoutRequest
    {
        public int IdUsuario { get; set; } = 1;
    }
    
}