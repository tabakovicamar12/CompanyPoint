using Microsoft.EntityFrameworkCore;

namespace HolidayService.Infrastructure.Database.Entities.Holiday
{
    public class HolidayDAO : BaseDAO<HolidayEntity, HolidayIncludeConfig, HolidayFilterConfig>
    {
        public HolidayDAO(
            HolidayServiceDbContext context,
            IIncludeService<HolidayEntity, HolidayIncludeConfig> includeService,
            IFilterService<HolidayEntity, HolidayFilterConfig> filterService,
            ILogger<BaseDAO<HolidayEntity>> logger) : base(context, includeService, filterService, logger)
        {
        }
    }
    public class HolidayIncludeConfig : IIncludeConfig<HolidayEntity>
    {
      
    }

    public class HolidayFilterConfig : IFilterConfig<HolidayEntity>
    {
       public string? EmployeeId { get; set; }

    }

    internal class HolidayIncludeService : IIncludeService<HolidayEntity, HolidayIncludeConfig>
    {
        public IQueryable<HolidayEntity> IncludeConfig(
            IQueryable<HolidayEntity> query,
            HolidayIncludeConfig includeConfig)
        {
           

            return query.IncludeConfig(includeConfig);
        }
    }

    internal class HolidayFilterService : IFilterService<HolidayEntity, HolidayFilterConfig>
    {
        public IQueryable<HolidayEntity> Filter(IQueryable<HolidayEntity> query, HolidayFilterConfig filterConfig)
        {
            return query.Filter(filterConfig);
        }
    }

    internal static class HolidayEntityExtensions
    {
        public static IQueryable<HolidayEntity> IncludeConfig(
            this IQueryable<HolidayEntity> query,
            HolidayIncludeConfig config)
        {

            return query;
        }

        public static IQueryable<HolidayEntity> Filter(
            this IQueryable<HolidayEntity> query,
            HolidayFilterConfig config)
        {
            if (config == null)
            {
                return query;
            }
            if (config.EmployeeId != null)
            {
                query = query.Where(h => h.EmployeeId == config.EmployeeId);
            }


            return query;
        }
    }
}
