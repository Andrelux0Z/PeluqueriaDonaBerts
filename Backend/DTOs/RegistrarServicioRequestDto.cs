using System.ComponentModel.DataAnnotations;

namespace Backend.DTOs;

public class RegistrarServicioRequestDto
{
    [Required(ErrorMessage = "La fecha es obligatoria.")]
    public DateTime Fecha { get; set; }

    [Required(ErrorMessage = "La descripción es obligatoria.")]
    [MaxLength(255, ErrorMessage = "La descripción no puede superar los 255 caracteres.")]
    public string Descripcion { get; set; } = string.Empty;

    [Required(ErrorMessage = "El monto es obligatorio.")]
    [Range(0.01, double.MaxValue, ErrorMessage = "El monto debe ser mayor a cero.")]
    public decimal MontoCobrado { get; set; }

    public int? IdConfiguracion { get; set; }

    public int? IdPostByUser { get; set; }
}
