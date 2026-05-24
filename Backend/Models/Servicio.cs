using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models;

[Table("Servicio", Schema = "dbo")]
public class Servicio
{
    [Key]
    public int Id { get; set; }

    [Required]
    public DateTime Fecha { get; set; }

    [Required]
    [MaxLength(1000)]
    public string Descripcion { get; set; } = string.Empty;

    [Required]
    [Column(TypeName = "decimal(10,2)")]
    public decimal MontoCobrado { get; set; }

    public int? IdConfiguracion { get; set; }

    [Required]
    public int IdPostByUser { get; set; }

    public DateTime FechaCreacion { get; set; } = DateTime.Now;

    [ForeignKey("IdPostByUser")]
    public Usuario? PostByUser { get; set; }
}
