namespace Backend.DTOs;

public class ServicioResponseDto
{
    public int Id { get; set; }
    public DateTime Fecha { get; set; }
    public string TipoServicio { get; set; } = string.Empty;
    public string NombreLibre { get; set; } = string.Empty;
    public decimal Monto { get; set; }
}
