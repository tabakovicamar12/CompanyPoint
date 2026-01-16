using System;
using System.Text;
using System.Threading;
using EmployeeService.Data;
using EmployeeService.Logging;
using EmployeeService.Middleware;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSingleton<RabbitMqLogPublisher>();

builder.Services.AddDbContext<EmployeeDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("EmployeeDb")));

var jwtSecret = Environment.GetEnvironmentVariable("JWT_SECRET");
Console.WriteLine($"[EmployeeService] JWT_SECRET loaded: {(string.IsNullOrEmpty(jwtSecret) ? "NO" : "YES")} len={(jwtSecret?.Length ?? 0)}");

if (string.IsNullOrEmpty(jwtSecret))
{
    throw new InvalidOperationException("JWT_SECRET ni nastavljen (mora biti isti kot v auth-service).");
}

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
    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header
    });

    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngularLocalhost", policy =>
    {
        policy
            .WithOrigins("http://localhost:4200", "https://localhost:4200")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();

app.UseCors("AllowAngularLocalhost");

app.UseMiddleware<CorrelationIdMiddleware>();

app.UseAuthentication();
app.UseAuthorization();

app.Use(async (context, next) =>
{
    var correlationId =
        context.Request.Headers["X-Correlation-Id"].FirstOrDefault()
        ?? context.TraceIdentifier;

    try
    {
        await next();
    }
    finally
    {
        try
        {
            var publisher = context.RequestServices.GetRequiredService<RabbitMqLogPublisher>();

            publisher.Publish(new
            {
                timestamp = DateTime.UtcNow,
                level = context.Response.StatusCode >= 500 ? "ERROR"
                      : context.Response.StatusCode >= 400 ? "WARN"
                      : "INFO",
                url = $"{context.Request.Method} {context.Request.Path}",
                correlationId,
                service = "EmployeeService",
                statusCode = context.Response.StatusCode
            });
        }
        catch
        {
        }
    }
});

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
                throw;
            }

            Thread.Sleep(delay);
        }
    }
}

app.MapControllers();
app.Run();
