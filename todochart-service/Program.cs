using System;
using System.Threading;
using Microsoft.EntityFrameworkCore;
using ToDoChartService.Data;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<ToDoDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("ToDoDb")));

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Èakanje na bazo + migracija
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ToDoDbContext>();

    var retries = 0;
    var maxRetries = 10;
    var delay = TimeSpan.FromSeconds(3);

    while (true)
    {
        try
        {
            Console.WriteLine("[ToDoChartService] Trying to migrate DB...");
            db.Database.Migrate();
            Console.WriteLine("[ToDoChartService] DB migrate OK");
            break;
        }
        catch (Exception ex)
        {
            retries++;
            Console.WriteLine($"[ToDoChartService] DB not ready (attempt {retries}/{maxRetries}): {ex.Message}");

            if (retries >= maxRetries)
            {
                Console.WriteLine("[ToDoChartService] Giving up on DB migrate.");
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
