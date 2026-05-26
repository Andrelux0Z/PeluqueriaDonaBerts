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

    public bool AplicaDescuento { get; set; }

    public string? TipoDescuento { get; set; }

    [Range(0, double.MaxValue, ErrorMessage = "El valor del descuento no puede ser negativo.")]
    public decimal ValorDescuento { get; set; } = 0;

    public string? Notas { get; set; }
}
