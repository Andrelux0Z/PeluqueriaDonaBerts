using System.ComponentModel.DataAnnotations;

namespace Backend.DTOs;

public class CreateUsuarioRequestDto
{
    [Required(ErrorMessage = "El nombre de usuario es obligatorio.")]
    [MaxLength(50)]
    public string Username { get; set; } = string.Empty;

    [Required(ErrorMessage = "La contraseña es obligatoria.")]
    [MinLength(8, ErrorMessage = "La contraseña debe tener al menos 8 caracteres.")]
    public string Password { get; set; } = string.Empty;

    [Required(ErrorMessage = "La confirmación de contraseña es obligatoria.")]
    public string ConfirmPassword { get; set; } = string.Empty;

    [Required(ErrorMessage = "El nivel de acceso es obligatorio.")]
    [RegularExpression("^(Admin|Empleado)$", ErrorMessage = "El rol debe ser 'Admin' o 'Empleado'.")]
    public string Rol { get; set; } = string.Empty;
}
