using System.ComponentModel.DataAnnotations;

namespace Backend.DTOs;

public class RegistrarCompraRequestDto
{
    [Required(ErrorMessage = "El producto es obligatorio.")]
    [Range(1, int.MaxValue, ErrorMessage = "Debe seleccionar un producto válido.")]
    public int IdProducto { get; set; }

    [Required(ErrorMessage = "La cantidad es obligatoria.")]
    [Range(1, int.MaxValue, ErrorMessage = "La cantidad debe ser mayor a cero.")]
    public int Cantidad { get; set; }

    [Required(ErrorMessage = "El precio unitario es obligatorio.")]
    [Range(0, double.MaxValue, ErrorMessage = "El precio no puede ser negativo.")]
    public decimal PrecioUnit { get; set; }

    [Range(0, 100, ErrorMessage = "El descuento debe estar entre 0 y 100.")]
    public decimal Descuento { get; set; } = 0;

    public string? Notas { get; set; }
}
