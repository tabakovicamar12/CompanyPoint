using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using StatisticsService.Data;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<StatsDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("StatsDb")));

var jwtSecret = Environment.GetEnvironmentVariable("JWT_SECRET");
if (string.IsNullOrWhiteSpace(jwtSecret))
    throw new InvalidOperationException("JWT_SECRET ni nastavljen.");

var key = Encoding.UTF8.GetBytes(jwtSecret);

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(key),
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(1),
            NameClaimType = "name",
            RoleClaimType = "role"
        };
    });

builder.Services.AddAuthorization();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(c =>
{
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Vnesi JWT v obliki: Bearer {token}"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();

app.UseAuthentication();
app.UseAuthorization();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<StatsDbContext>();

    var retries = 0;
    var maxRetries = 10;
    var delay = TimeSpan.FromSeconds(3);

    while (true)
    {
        try
        {
            Console.WriteLine("[StatisticsService] Trying to migrate DB...");
            db.Database.Migrate();
            Console.WriteLine("[StatisticsService] DB migrate OK");
            break;
        }
        catch (Exception ex)
        {
            retries++;
            Console.WriteLine($"[StatisticsService] DB not ready (attempt {retries}/{maxRetries}): {ex.Message}");

            if (retries >= maxRetries) throw;
            Thread.Sleep(delay);
        }
    }
}

app.MapControllers();
app.Run();
