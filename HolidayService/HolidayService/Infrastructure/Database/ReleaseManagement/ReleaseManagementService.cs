
using HolidayService.Infrastructure.Database.ReleaseManagement.Updates;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Storage;
using System.Diagnostics;

namespace HolidayService.Infrastructure.Database.ReleaseManagement
{
    internal class ReleaseManagementService
    {
        private readonly HolidayServiceDbContext _context;
        private readonly ILogger<ReleaseManagementService> _logger;

        
        private readonly IReadOnlyList<IUpdate> _updateList = new List<IUpdate>
        {
           new Update_20251129145037_AddedHoliday(),
           new Update_20260104163512_EmployeeIdText(),

        };

        public ReleaseManagementService(
            HolidayServiceDbContext context,
            ILogger<ReleaseManagementService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public void ApplyMigrations()
        {
#if DEBUG
            Debugger.Break();
#endif

            _logger.LogInformation("Applying pending migrations");

            try
            {
                IDatabaseCreator databaseCreator = _context.Database.GetService<IDatabaseCreator>();
                if (databaseCreator == null)
                    throw new Exception("EF core not initialized");

                IRelationalDatabaseCreator relationalDatabaseCreator = (IRelationalDatabaseCreator)databaseCreator;

                if (!relationalDatabaseCreator.Exists())
                {
                    _logger.LogInformation("Creating new database");
                    relationalDatabaseCreator.Create();
                    _logger.LogInformation("Database created");
                }

                IEnumerable<IUpdate> updates = _updateList;

                List<string> appliedMigrations = _context.Database
                    .GetAppliedMigrations()
                    .ToList();

                foreach (IUpdate update in updates)
                {
                    if (update.ShouldExecute(appliedMigrations))
                    {
                        PerformUpdateInTransaction(update);
                    }
                }

                _logger.LogInformation("Migration execution finished");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during migration execution");
                throw;
            }
        }

        public void CreateDatabaseWithoutMigrations()
        {
#if DEBUG
            Debugger.Break();
#endif

            _logger.LogInformation("Creating database without migrations");

            IDatabaseCreator databaseCreator = _context.Database.GetService<IDatabaseCreator>();
            if (databaseCreator == null)
                throw new Exception("EF core not initialized");

            IRelationalDatabaseCreator relationalDatabaseCreator = (IRelationalDatabaseCreator)databaseCreator;

            if (relationalDatabaseCreator.Exists())
            {
                _logger.LogInformation("Database already exists — skipping");
                return;
            }

            bool created = _context.Database.EnsureCreated();
            if (!created)
            {
                _logger.LogError("Failed to create database without migrations");
                return;
            }

            _logger.LogInformation("Database created");
        }

        private void PerformUpdateInTransaction(IUpdate update)
        {
            _logger.LogInformation("Executing migration {MigrationId}", update.MigrationId);

            using IDbContextTransaction transaction = _context.Database.BeginTransaction();

            try
            {
                _logger.LogInformation("Step 1: Before schema change");
                update.BeforeSchemaChange(_context);

                _logger.LogInformation("Step 2: Schema change");
                update.SchemaChange(_context);

                _logger.LogInformation("Step 3: After schema change");
                update.AfterSchemaChange(_context);

                transaction.Commit();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Migration failed {MigrationId}", update.MigrationId);
                transaction.Rollback();
                throw;
            }

            _logger.LogInformation("Migration {MigrationId} executed", update.MigrationId);
        }
    }

    public static class ReleaseManagementExtensions
    {
        public static void ApplyMigration(this IServiceScope scope)
        {
            var service = scope.ServiceProvider.GetRequiredService<ReleaseManagementService>();
            service.ApplyMigrations();
        }

        public static void CreateDatabaseWithoutMigrations(this IServiceScope scope)
        {
            var service = scope.ServiceProvider.GetRequiredService<ReleaseManagementService>();
            service.CreateDatabaseWithoutMigrations();
        }
    }
}
