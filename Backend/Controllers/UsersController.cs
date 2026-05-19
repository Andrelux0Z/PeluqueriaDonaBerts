using System.Data;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Backend.Data;
using Backend.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Backend.Models;

namespace Backend.Controllers;

[ApiController]
[Route("api/users")]
[Authorize(Roles = "Admin")]
public class UsersController(AppDbContext db, IConfiguration config) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> CreateUser([FromBody] CreateUsuarioRequestDto request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        if (request.Password != request.ConfirmPassword)
            return BadRequest(new { message = "Las contraseñas no coinciden." });

        bool usernameExists = await db.Usuarios
            .AnyAsync(u => u.Username == request.Username);

        if (usernameExists)
            return Conflict(new { message = "El nombre de usuario ya existe en el sistema." });

        var nuevoUsuario = new Usuario
        {
            Username = request.Username,
            PasswordHash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(request.Password))),
            Rol = request.Rol,
            Activo = true
        };

        db.Usuarios.Add(nuevoUsuario);
        await db.SaveChangesAsync();

        await RegistrarBitacoraAsync(
            descripcion: $"Usuario '{nuevoUsuario.Username}' creado con rol '{nuevoUsuario.Rol}'");

        return CreatedAtAction(nameof(CreateUser), new
        {
            id = nuevoUsuario.Id,
            username = nuevoUsuario.Username,
            rol = nuevoUsuario.Rol
        });
    }

    private async Task RegistrarBitacoraAsync(string descripcion)
    {
        var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        int.TryParse(idClaim, out int idAdmin);
        string remoteIp = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";

        try
        {
            string connStr = config.GetConnectionString("DefaultConnection")!;
            await using var conn = new SqlConnection(connStr);
            await conn.OpenAsync();

            await using var cmd = new SqlCommand("dbo.sp_InsertarBitacoraEvento", conn)
            {
                CommandType = CommandType.StoredProcedure
            };

            cmd.Parameters.AddWithValue("@inIdTipoEvento", 5);
            cmd.Parameters.AddWithValue("@inDescripcion", descripcion);
            cmd.Parameters.AddWithValue("@inIdPostByUser", idAdmin);
            cmd.Parameters.AddWithValue("@inIpPostIn", remoteIp);

            var pResultCode = new SqlParameter("@outResultCode", SqlDbType.Int) { Direction = ParameterDirection.Output };
            cmd.Parameters.Add(pResultCode);

            await cmd.ExecuteNonQueryAsync();
        }
        catch
        {
            // La creación del usuario ya fue exitosa; no se revierte por fallo en bitácora
        }
    }
}
