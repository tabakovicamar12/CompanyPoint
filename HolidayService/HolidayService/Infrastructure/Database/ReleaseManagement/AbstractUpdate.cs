
using Microsoft.EntityFrameworkCore;

namespace HolidayService.Infrastructure.Database.ReleaseManagement
{
    public abstract class AbstractUpdate : IUpdate
    {
        public abstract string MigrationId { get; }

        public virtual bool ShouldExecute(List<string> appliedMigrations)
        {
            return !appliedMigrations.Contains(MigrationId);
        }

        public virtual void BeforeSchemaChange(HolidayServiceDbContext context) { }

        public virtual void SchemaChange(HolidayServiceDbContext context)
        {
            ExecuteMigrationSql(context);
        }

        public virtual void AfterSchemaChange(HolidayServiceDbContext context) { }

        protected virtual void ExecuteMigrationSql(HolidayServiceDbContext context)
        {
            string basePath = AppContext.BaseDirectory;
            string filePath = Path.Combine(basePath, "Infrastructure", "Database", "ReleaseManagement", "Scripts",  $@"{MigrationId}.sql");
            string sql = File.ReadAllText(filePath);
            context.Database.ExecuteSqlRaw(sql);
        }
    }
}
