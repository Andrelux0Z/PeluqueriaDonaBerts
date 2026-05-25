using System.ComponentModel.DataAnnotations;

namespace Backend.DTOs;

public class ActualizarTipoServicioRequestDto
{
    [Required(ErrorMessage = "El nombre del servicio es obligatorio.")]
    [MaxLength(100, ErrorMessage = "El nombre no puede superar los 100 caracteres.")]
    public string NombreServicio { get; set; } = string.Empty;

    [Required(ErrorMessage = "El precio base es obligatorio.")]
    [Range(0, double.MaxValue, ErrorMessage = "El precio base no puede ser negativo.")]
    public decimal PrecioBase { get; set; }
}
