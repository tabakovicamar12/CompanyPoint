
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using HolidayService.Infrastructure.Database.ReleaseManagement;
using HolidayService.Infrastructure.Database.Entities.Holiday;

namespace HolidayService.Infrastructure.Database
{
    public static class DatabaseDIExtensions
    {
        public static void AddDatabase(this IServiceCollection services, IConfiguration configuration)
        {
            var databaseOptions = configuration.GetSection("Database").Get<DatabaseOptions>();

            string connectionString = string.Format(
                databaseOptions.ConnectionString,
                databaseOptions.UserId,
                databaseOptions.Password,
                databaseOptions.Host,
                databaseOptions.Port,
                databaseOptions.Database);

            services.AddDbContext<HolidayServiceDbContext>(options =>
            {
                options.UseNpgsql(connectionString);
                options.UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking);
            });
             services.AddScoped<ReleaseManagementService>();
        }

        public static void AddDao(this IServiceCollection services)
        {
            services.AddSingleton<IIncludeService<HolidayEntity, HolidayIncludeConfig>, HolidayIncludeService>();
            services.AddSingleton<IFilterService<HolidayEntity, HolidayFilterConfig>, HolidayFilterService>();
            services.AddTransient<HolidayDAO>();
        }
    }

    public class DatabaseOptions
    {
        public string ConnectionString { get; set; }
        public string UserId { get; set; }
        public string Password { get; set; }
        public string Host { get; set; }
        public int Port { get; set; }
        public string Database { get; set; }
    }
}
