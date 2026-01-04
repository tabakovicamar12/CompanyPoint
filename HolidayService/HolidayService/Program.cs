using System.Net;
using System.Net.Mime;
using System.Text.Json;
using CommonLibrary;
using CommonLibrary.Date;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.HttpLogging;
using Microsoft.AspNetCore.Mvc;
using NLog;
using NLog.Web;

using HolidayService.Infrastructure.Database.ReleaseManagement;
using HolidayService.Infrastructure.Database;
using Microsoft.AspNetCore.Identity;
using HolidayService.Features;
using Microsoft.OpenApi.Models;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;


namespace HolidayService
{
    public class Program
    {
        public static void Main(string[] args)
        {
            Logger logger = LogManager
                .Setup()
                .LoadConfigurationFromAppSettings()
                .GetLogger("Program");

            logger.Info("Initializing Skribbl");

            try
            {
                WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

                builder.Host.UseNLog();

                ConfigureServices(builder.Services, builder.Configuration);

                WebApplication app = builder.Build();

                PrepareDatabase(app.Services);

                if (!app.Environment.IsDevelopment())
                {
                    app.UseExceptionHandler("/Home/Error");
                    app.UseHsts();
                }

                app.UseHttpsRedirection();
                app.UseStaticFiles();

                app.UseRouting();

                app.UseCors();

                // Add authentication before authorization
                app.UseAuthentication();
                app.UseAuthorization();

                Configure(app, app.Environment, app.Configuration);
                app.Run();
            }
            catch (Exception ex)
            {
                logger.Error("Skribbl api failed. {@obj}", new
                {
                    Exception = ex.Message,
                    CallStack = ex.StackTrace,
                });
            }

            logger.Info("Stopping Skribbl api");
        }

        private static void ConfigureServices(IServiceCollection services, IConfiguration configuration)
        {
            services.AddControllers();
            services.AddHealthChecks();

            services.AddCors(options =>
            {
                options.AddDefaultPolicy(policy =>
                {
                    policy
                        .WithOrigins("http://localhost:5173")
                        .AllowAnyMethod()
                        .AllowAnyHeader()
                        .AllowCredentials();
                });
            });

            services.Configure<ApiBehaviorOptions>(options =>
            {
                options.InvalidModelStateResponseFactory = (context) =>
                {
                    ResultMultiMessageModel response = context.ModelState.ToResultMultiMessageModel();
                    return new BadRequestObjectResult(response);
                };
            });

            services.AddHttpLogging(options =>
            {
                options.LoggingFields =
                    HttpLoggingFields.RequestProperties
                    | HttpLoggingFields.RequestQuery
                    | HttpLoggingFields.ResponseStatusCode
                    | HttpLoggingFields.Duration;
            });

            // JWT authentication to validate tokens from auth-service
            var jwtSecret = Environment.GetEnvironmentVariable("JWT_SECRET");
            if (string.IsNullOrWhiteSpace(jwtSecret))
            {
                // Fallback to configuration for local development
                jwtSecret = configuration["Jwt:Secret"];
            }
            if (string.IsNullOrWhiteSpace(jwtSecret))
            {
                throw new InvalidOperationException("JWT_SECRET/Jwt:Secret ni nastavljen. Poskrbi, da se ujema z auth-service.");
            }
            var key = Encoding.UTF8.GetBytes(jwtSecret);

            services
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

            services.AddAuthorization();

            services.ConfigureSwagger();

            services.AddHttpContextAccessor();

            services.AddCommonLibrary();

            services.AddSingleton(TimeProvider.System);
            services.AddSingleton(new ZonedDateService(ZonedDateService.TimeZones.Ljubljana));

            services.AddDatabase(configuration);
            services.AddDao();

            services.AddFeatures(configuration);
        }

        private static void Configure(IApplicationBuilder app, IWebHostEnvironment environment, IConfiguration configuration)
        {
            app.UseSwagger(environment);

            app.UseExceptionHandler(error =>
            {
                error.Run(async context =>
                {
                    ILoggerFactory loggerFactory = context.RequestServices.GetRequiredService<ILoggerFactory>();
                    Microsoft.Extensions.Logging.ILogger logger = loggerFactory.CreateLogger("global_exception");

                    IExceptionHandlerFeature? exceptionFeature = context.Features.Get<IExceptionHandlerFeature>();
                    if (exceptionFeature == null)
                    {
                        logger.LogError($"There was an exception but could not get the exception feature");
                        return;
                    }

                    logger.LogError(exceptionFeature.Error, $"There was an error");

                    context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
                    context.Response.ContentType = MediaTypeNames.Application.Json;
                    await context.Response.WriteAsync(JsonSerializer.Serialize(new EmptyResult()), System.Text.Encoding.UTF8);
                });
            });

            app.UseRouting();

            app.UseWhen(
                context => !context.Request.Path.StartsWithSegments("/health"),
                builder => builder.UseHttpLogging());

            app.UseEndpoints(routes =>
            {
                routes.MapControllers();
                routes.MapHealthChecks("/health");
            });
        }

        private static void PrepareDatabase(IServiceProvider serviceProvider)
        {
            using IServiceScope serviceScope = serviceProvider.CreateScope();
            serviceScope.ApplyMigration();
        }
    }

    public static class SwaggerExtensions
    {
        public static void ConfigureSwagger(this IServiceCollection services)
        {
            services.AddEndpointsApiExplorer();
            services.AddSwaggerGen(c =>
            {
                c.SwaggerDoc("v1", new OpenApiInfo { Title = "My API", Version = "v1" });

                // Add JWT bearer to Swagger
                c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
                {
                    Name = "Authorization",
                    Type = SecuritySchemeType.Http,
                    Scheme = "Bearer",
                    BearerFormat = "JWT",
                    In = ParameterLocation.Header
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
        }

        public static void UseSwagger(this IApplicationBuilder app, IWebHostEnvironment environment)
        {
            if (environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }
        }
    }
}
