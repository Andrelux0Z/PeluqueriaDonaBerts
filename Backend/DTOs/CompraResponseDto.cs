namespace Backend.DTOs;

public class CompraResponseDto
{
    public int Id { get; set; }
    public DateTime Fecha { get; set; }
    public string NombreProducto { get; set; } = string.Empty;
    public int Cantidad { get; set; }
    public decimal PrecioUnit { get; set; }
    public string TipoDescuento { get; set; } = "PORCENTAJE";
    public decimal Descuento { get; set; }
    public decimal Subtotal { get; set; }
}
