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

                        // Parámetros de entrada
                        command.Parameters.Add(new SqlParameter("@inUsuario", request.Usuario));
                        command.Parameters.Add(new SqlParameter("@inPassword", request.Password));
                        command.Parameters.Add(new SqlParameter("@inIpPostIn", remoteIp));

                        // Parámetros de salida
                        var outIdUsuario = new SqlParameter("@outIdUsuario", SqlDbType.Int) { Direction = ParameterDirection.Output };
                        var outResultCode = new SqlParameter("@outResultCode", SqlDbType.Int) { Direction = ParameterDirection.Output };

                        command.Parameters.Add(outIdUsuario);
                        command.Parameters.Add(outResultCode);

                        // Ejecutamos el Store Procedure de Login, el cual a su vez
                        // ya se encarga internamente de insertar los logs correspondientes en BitacoraEventos
                        command.ExecuteNonQuery();

                        int resultCode = (int)outResultCode.Value;
                        int idUsuario = (int)outIdUsuario.Value;

                        if (resultCode == 0) // Asumimos que 0 significa que todo salió bien y las credenciales son válidas
                        {
                            // En un entorno de bajo nivel o uso académico, se envía simplemente el OK.
                            // Aquí el frontend guardará un registro básico en el navegador y avanzará.
                            return Ok(new { success = true, idUsuario = idUsuario, message = "Inicio de sesión exitoso" });
                        }
                        else if (resultCode == 50001)
                        {
                            return BadRequest(new { success = false, message = "El usuario ingresado no existe." });
                        }
                        else if (resultCode == 50002)
                        {
                            return BadRequest(new { success = false, message = "Contraseña incorrecta." });
                        }
                        else if (resultCode == 50003)
                        {
                            return BadRequest(new { success = false, message = "Cuenta bloqueada por múltiples intentos fallidos. Intente de nuevo en 20 minutos." });
                        }
                        else
                        {
                            return BadRequest(new { success = false, message = "Error inesperado al iniciar sesión." });
                        }
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