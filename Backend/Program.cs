var builder = WebApplication.CreateBuilder(args);

// Configurar los controladores
builder.Services.AddControllers();

// Configurar CORS para permitir que el frontend se comunique
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend",
        policy =>
        {
            policy.WithOrigins("http://localhost:3000") // El puerto por defecto de Next.js
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        });
});

var app = builder.Build();

app.UseCors("AllowFrontend");

app.UseAuthorization();
app.MapControllers();

app.Run();