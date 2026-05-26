namespace Backend.DTOs;

public class FiltroHistorialQueryDto
{
    public string? TipoTransaccion { get; set; }

    public DateTime? FechaInicio { get; set; }

    public DateTime? FechaFin { get; set; }

    public decimal? MontoMin { get; set; }

    public decimal? MontoMax { get; set; }

    public string? Detalle { get; set; }

    public bool TieneAlgunCriterio =>
        !string.IsNullOrWhiteSpace(TipoTransaccion) ||
        FechaInicio.HasValue ||
        FechaFin.HasValue ||
        MontoMin.HasValue ||
        MontoMax.HasValue ||
        !string.IsNullOrWhiteSpace(Detalle);
}