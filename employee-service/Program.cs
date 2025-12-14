using System;
using System.Threading;
using EmployeeService.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<EmployeeDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("EmployeeDb")));

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Èakanje na bazo + migracija
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<EmployeeDbContext>();

    var retries = 0;
    var maxRetries = 10;
    var delay = TimeSpan.FromSeconds(3);

    while (true)
    {
        try
        {
            Console.WriteLine("[EmployeeService] Trying to migrate DB...");
            db.Database.Migrate();
            Console.WriteLine("[EmployeeService] DB migrate OK");
            break;
        }
        catch (Exception ex)
        {
            retries++;
            Console.WriteLine($"[EmployeeService] DB not ready (attempt {retries}/{maxRetries}): {ex.Message}");

            if (retries >= maxRetries)
            {
                Console.WriteLine("[EmployeeService] Giving up on DB migrate.");
                throw;
            }

            Thread.Sleep(delay);
        }
    }
}

// Swagger vedno, brez if
app.UseSwagger();
app.UseSwaggerUI();

// brez HTTPS preusmeritve
// app.UseHttpsRedirection();

app.UseAuthorization();
app.MapControllers();
app.Run();
