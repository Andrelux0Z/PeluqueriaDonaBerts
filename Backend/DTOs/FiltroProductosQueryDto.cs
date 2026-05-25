namespace Backend.DTOs;

public class FiltroProductosQueryDto
{
    public string? Nombre { get; set; }

    public string? Codigo { get; set; }

    public decimal? PrecioMin { get; set; }

    public decimal? PrecioMax { get; set; }

    public int? CantidadMin { get; set; }

    public int? CantidadMax { get; set; }

    public bool TieneAlgunCriterio =>
        !string.IsNullOrWhiteSpace(Nombre) ||
        !string.IsNullOrWhiteSpace(Codigo) ||
        PrecioMin.HasValue ||
        PrecioMax.HasValue ||
        CantidadMin.HasValue ||
        CantidadMax.HasValue;
}