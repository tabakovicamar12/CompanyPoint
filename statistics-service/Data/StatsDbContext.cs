using Microsoft.EntityFrameworkCore;
using StatisticsService.Models;

namespace StatisticsService.Data;

public class StatsDbContext : DbContext
{
    public StatsDbContext(DbContextOptions<StatsDbContext> options) : base(options) { }

    public DbSet<EndpointCall> EndpointCalls => Set<EndpointCall>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<EndpointCall>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Endpoint).IsRequired().HasMaxLength(512);
            e.Property(x => x.CalledAt).IsRequired();
            e.HasIndex(x => x.CalledAt);
            e.HasIndex(x => x.Endpoint);
        });
    }
}
