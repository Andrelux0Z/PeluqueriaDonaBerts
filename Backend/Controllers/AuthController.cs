using System.Data;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Backend.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.IdentityModel.Tokens;

namespace Backend.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(IConfiguration config) : ControllerBase
{
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequestDto request)
    {
        string remoteIp = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
        string connStr = config.GetConnectionString("DefaultConnection")!;

        int resultCode = 0;
        int idUsuario = 0;
        string passwordHash = string.Empty;
        string rol = string.Empty;

        try
        {
            await using var conn = new SqlConnection(connStr);
            await conn.OpenAsync();

            await using var cmd = new SqlCommand("dbo.sp_Login", conn)
            {
                CommandType = CommandType.StoredProcedure
            };

            cmd.Parameters.AddWithValue("@inUsuario", request.Username);
            cmd.Parameters.AddWithValue("@inIpPostIn", remoteIp);

            var pResultCode = new SqlParameter("@outResultCode", SqlDbType.Int) { Direction = ParameterDirection.Output };
            var pIdUsuario = new SqlParameter("@outIdUsuario", SqlDbType.Int) { Direction = ParameterDirection.Output };
            var pPasswordHash = new SqlParameter("@outPasswordHash", SqlDbType.VarChar, 255) { Direction = ParameterDirection.Output };
            var pRol = new SqlParameter("@outRol", SqlDbType.VarChar, 20) { Direction = ParameterDirection.Output };

            cmd.Parameters.Add(pResultCode);
            cmd.Parameters.Add(pIdUsuario);
            cmd.Parameters.Add(pPasswordHash);
            cmd.Parameters.Add(pRol);

            await cmd.ExecuteNonQueryAsync();

            resultCode = (int)pResultCode.Value;
            idUsuario = (int)pIdUsuario.Value;
            passwordHash = pPasswordHash.Value?.ToString() ?? string.Empty;
            rol = pRol.Value?.ToString() ?? string.Empty;
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error al conectar con la base de datos.", detail = ex.Message });
        }

        if (resultCode == 50001)
            return Unauthorized(new { message = "El usuario ingresado no existe." });

        if (resultCode == 50003)
            return Unauthorized(new { message = "La cuenta está desactivada. Contacte al administrador." });

        if (resultCode != 0)
            return StatusCode(500, new { message = "Error inesperado al iniciar sesión." });

        var hashIngresado = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(request.Password)));
        if (!string.Equals(hashIngresado, passwordHash, StringComparison.OrdinalIgnoreCase))
            return Unauthorized(new { message = "Contraseña incorrecta." });

        var token = GenerarJwt(idUsuario, request.Username, rol);

        return Ok(new LoginResponseDto
        {
            Token = token,
            Username = request.Username,
            Rol = rol
        });
    }

    [Authorize]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        string remoteIp = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
        string connStr = config.GetConnectionString("DefaultConnection")!;

        var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(idClaim, out int idUsuario))
            return Unauthorized();

        try
        {
            await using var conn = new SqlConnection(connStr);
            await conn.OpenAsync();

            await using var cmd = new SqlCommand("dbo.sp_InsertarBitacoraEvento", conn)
            {
                CommandType = CommandType.StoredProcedure
            };

            cmd.Parameters.AddWithValue("@inIdTipoEvento", 4);
            cmd.Parameters.AddWithValue("@inDescripcion", "Cierre de sesión");
            cmd.Parameters.AddWithValue("@inIdPostByUser", idUsuario);
            cmd.Parameters.AddWithValue("@inIpPostIn", remoteIp);

            var pResultCode = new SqlParameter("@outResultCode", SqlDbType.Int) { Direction = ParameterDirection.Output };
            cmd.Parameters.Add(pResultCode);

            await cmd.ExecuteNonQueryAsync();
        }
        catch
        {
            // El logout se completa aunque la bitácora falle
        }

        return Ok(new { message = "Sesión cerrada correctamente." });
    }

    private string GenerarJwt(int idUsuario, string username, string rol)
    {
        var jwtSettings = config.GetSection("Jwt");
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings["Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, idUsuario.ToString()),
            new Claim(ClaimTypes.Name, username),
            new Claim(ClaimTypes.Role, rol),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var token = new JwtSecurityToken(
            issuer: jwtSettings["Issuer"],
            audience: jwtSettings["Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(double.Parse(jwtSettings["ExpiryMinutes"]!)),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
