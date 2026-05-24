using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models;

[Table("Servicio", Schema = "dbo")]
public class Servicio
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int IdTipoServicio { get; set; }

    [Required]
    [MaxLength(255)]
    public string NombreLibre { get; set; } = string.Empty;

    [Required]
    public DateTime Fecha { get; set; }

    [Required]
    [Column(TypeName = "decimal(10,2)")]
    public decimal Monto { get; set; }
}
