
using System.Collections.Generic;

namespace HolidayService.Infrastructure.Database.ReleaseManagement
{
    internal interface IUpdate
    {
        string MigrationId { get; }
        bool ShouldExecute(List<string> appliedMigrations);
        void BeforeSchemaChange(HolidayServiceDbContext context);
        void SchemaChange(HolidayServiceDbContext context);
        void AfterSchemaChange(HolidayServiceDbContext context);
    }
}
