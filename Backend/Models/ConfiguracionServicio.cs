using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models;

[Table("ConfiguracionServicio", Schema = "dbo")]
public class ConfiguracionServicio
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string NombreServicio { get; set; } = string.Empty;

    [Required]
    [Column(TypeName = "decimal(10,2)")]
    public decimal PrecioBase { get; set; }

    public bool Activo { get; set; } = true;
}
