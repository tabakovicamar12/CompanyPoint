
using CommonLibrary.Database;
using HolidayService.Infrastructure.Database.Entities.Holiday;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;

namespace HolidayService.Infrastructure.Database
{
    public class HolidayServiceDbContext : DbContext
    {
        private readonly TimeProvider _timeProvider;
        
        public DbSet<HolidayEntity> Holidays { get; set; } = null!;
        public HolidayServiceDbContext(DbContextOptions<HolidayServiceDbContext> options, TimeProvider timeProvider)
            : base(options)
        {
            _timeProvider = timeProvider;
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
        }

        private void ProcessEntities()
        {
            var entities = ChangeTracker.Entries().ToList();
            var now = _timeProvider.GetUtcNow();

            foreach (var entity in entities)
            {
                if (entity.State == EntityState.Unchanged || entity.State == EntityState.Detached)
                    continue;

                if (entity.State == EntityState.Added && entity.Entity is ICreatedTimestampEntity created)
                    created.CreatedTimestamp = now;

                if (entity.Entity is IModifiedTimestampEntity modified)
                    modified.ModifiedTimestamp = now;

                if (entity.State == EntityState.Deleted && entity.Entity is ISoftDeleteEntity softDelete)
                {
                    entity.State = EntityState.Unchanged;
                    softDelete.DeletedTimestamp = now;
                }
            }
        }

        public override int SaveChanges(bool acceptAllChangesOnSuccess)
        {
            ProcessEntities();
            return base.SaveChanges(acceptAllChangesOnSuccess);
        }

        public override async Task<int> SaveChangesAsync(bool acceptAllChangesOnSuccess, CancellationToken cancellationToken = default)
        {
            ProcessEntities();
            return await base.SaveChangesAsync(acceptAllChangesOnSuccess, cancellationToken);
        }
    }
}
