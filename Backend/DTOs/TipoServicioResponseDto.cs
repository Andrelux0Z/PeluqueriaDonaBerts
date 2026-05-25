namespace Backend.DTOs;

public class TipoServicioResponseDto
{
    public int Id { get; set; }
    public string NombreServicio { get; set; } = string.Empty;
    public decimal PrecioBase { get; set; }
    public bool EsActivo { get; set; }
}
