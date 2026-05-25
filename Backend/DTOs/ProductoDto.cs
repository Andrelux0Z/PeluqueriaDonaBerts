namespace Backend.DTOs;

public class ProductoDto
{
    public int Id { get; set; }

    public string Codigo { get; set; } = string.Empty;

    public string Nombre { get; set; } = string.Empty;

    public int Cantidad { get; set; }

    public decimal Precio { get; set; }

    public int StockMinimo { get; set; }
}