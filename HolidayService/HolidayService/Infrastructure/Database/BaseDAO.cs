
using CommonLibrary.Database;
using CommonLibrary.Pagination;
using CommonLibrary.User;
using CommonLibrary;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore.Infrastructure;

namespace HolidayService.Infrastructure.Database
{
    public class BaseDAO<TEntity>
           where TEntity : class
    {
        protected readonly HolidayServiceDbContext _context;

        protected readonly ILogger<BaseDAO<TEntity>> _logger;

        public BaseDAO(HolidayServiceDbContext context, ILogger<BaseDAO<TEntity>> logger)
        {
            _context = context;
            _logger = logger;
        }

        public virtual Task<List<TEntity>> Get()
        {
            return _context
                .Set<TEntity>()
                .ToListAsync();
        }

        public virtual async Task<Result> Add(TEntity entity)
        {
            _context.Add(entity);

            int changes = await _context.SaveChangesAsync();
            if (changes == 0)
            {
                _logger.LogError("Failed to add entity");
                return Result.Fail("Failed to add entity");
            }

            _context.Entry(entity).State = EntityState.Detached;

            return Result.Ok();
        }

        public virtual async Task<Result> AddRange(List<TEntity> entities)
        {
            _context.AddRange(entities);

            int changes = await _context.SaveChangesAsync();
            if (changes == 0)
            {
                _logger.LogError("Failed to add entity");
                return Result.Fail("Failed to add entity");
            }

            foreach (TEntity entity in entities)
            {
                _context.Entry(entity).State = EntityState.Detached;
            }

            return Result.Ok();
        }

        public virtual async Task<Result> Update(TEntity entity)
        {
            _context.Update(entity);

            int changes = await _context.SaveChangesAsync();
            if (changes == 0)
            {
                _logger.LogError("Failed to update entity");
                return Result.Fail("Failed to update entity");
            }

            _context.Entry(entity).State = EntityState.Detached;

            return Result.Ok();
        }

        public virtual async Task<Result> UpdateReload(TEntity entity)
        {
            _context.Update(entity);

            int changes = await _context.SaveChangesAsync();
            if (changes == 0)
            {
                _logger.LogError("Failed to update entity");
                return Result.Fail("Failed to update entity");
            }

            _context.Entry(entity).State = EntityState.Detached;

            return Result.Ok();
        }

        public virtual Task<Result> Update(TEntity entity, Expression<Func<TEntity, object>> property)
        {
            return Update(entity, new List<Expression<Func<TEntity, object>>> { property });
        }

        public virtual async Task<Result> Update(TEntity entity, List<Expression<Func<TEntity, object>>> properties)
        {
            foreach (Expression<Func<TEntity, object>> property in properties)
            {
                _context.Entry(entity).Property(property).IsModified = true;
            }

            int changes = await _context.SaveChangesAsync();
            if (changes == 0)
            {
                _logger.LogError("Failed to update entity");
                return Result.Fail("Failed to update entity");
            }

            _context.Entry(entity).State = EntityState.Detached;

            return Result.Ok();
        }

        public virtual async Task<Result> UpdateRange(List<TEntity> entities, List<Expression<Func<TEntity, object>>> properties)
        {
            foreach (TEntity entity in entities)
            {
                foreach (Expression<Func<TEntity, object>> property in properties)
                {
                    _context.Entry(entity).Property(property).IsModified = true;
                }
            }

            int changes = await _context.SaveChangesAsync();
            if (changes != entities.Count)
            {
                _logger.LogError("Failed to update entities. {@obj}", new { Changes = changes, ExpectedCahnges = entities.Count });
            }

            foreach (var entity in entities)
            {
                _context.Entry(entity).State = EntityState.Detached;
            }

            return Result.Ok();
        }

        public virtual async Task<Result> UpdateRange(List<TEntity> entities)
        {
            foreach (TEntity entity in entities)
            {
                _context.Update(entity);
            }

            int changes = await _context.SaveChangesAsync();
            if (changes != entities.Count)
            {
                _logger.LogError("Failed to update entities. {@obj}", new { Changes = changes, ExpectedCahnges = entities.Count });
            }

            foreach (var entity in entities)
            {
                _context.Entry(entity).State = EntityState.Detached;
            }

            return Result.Ok();
        }

        public async Task<Result> Remove(TEntity entity)
        {
            _context.Remove(entity);

            int changes = await _context.SaveChangesAsync();
            if (changes == 0)
            {
                _logger.LogError("Failed to update entity");
                return Result.Fail("Failed to update entity");
            }

            _context.Entry(entity).State = EntityState.Detached;

            return Result.Ok();
        }

        public async Task<Result> RemoveRange(List<TEntity> entities)
        {
            foreach (TEntity entity in entities)
            {
                _context.Remove(entity);
            }

            int changes = await _context.SaveChangesAsync();
            if (changes == 0)
            {
                _logger.LogError("Failed to update entity");
                return Result.Fail("Failed to update entity");
            }

            foreach (TEntity entity in entities)
            {
                _context.Entry(entity).State = EntityState.Detached;
            }

            return Result.Ok();
        }

        internal virtual async Task<Result> Cancel<T>(T entity)
            where T : class, ICancelledEntity
        {
            IUserInfoService userInfoService = _context.Database.GetService<IUserInfoService>();

            entity.CancelledTimestamp = DateTime.UtcNow;
            entity.CancelledBy = userInfoService.GetUserId();

            _context.Entry(entity).Property(x => x.CancelledTimestamp).IsModified = true;
            _context.Entry(entity).Property(x => x.CancelledBy).IsModified = true;

            int changes = await _context.SaveChangesAsync();
            if (changes != 1)
            {
                _logger.LogError("Failed to cancel entity");
                return Result.Fail("Failed to cancel entity");
            }

            return Result.Ok();
        }

        internal virtual Task<T?> Get<T>(Guid id) where T : class, IGuidIdEntity
        {
            return _context.Set<T>().WithId(id).SingleOrDefaultAsync();
        }

        internal virtual Task<T?> Get<T>(long id) where T : class, ILongIdEntity
        {
            return _context.Set<T>().WithId(id).SingleOrDefaultAsync();
        }

        internal virtual Task<bool> Exists<T>(Guid id) where T : class, IGuidIdEntity
        {
            return _context.Set<T>().WithId(id).AnyAsync();
        }

        internal virtual Task<bool> Exists<T>(long id) where T : class, ILongIdEntity
        {
            return _context.Set<T>().WithId(id).AnyAsync();
        }
    }

    public class BaseDAO<TEntity, TIncludeConfig, TFilterConfig> : BaseDAO<TEntity>
        where TEntity : class, IEntity
        where TIncludeConfig : IIncludeConfig<TEntity>
        where TFilterConfig : IFilterConfig<TEntity>
    {
        private readonly IIncludeService<TEntity, TIncludeConfig> _includeService;
        private readonly IFilterService<TEntity, TFilterConfig> _filterService;

        public BaseDAO(
            HolidayServiceDbContext context,
            IIncludeService<TEntity, TIncludeConfig> includeService,
            IFilterService<TEntity, TFilterConfig> filterService,
            ILogger<BaseDAO<TEntity>> logger) : base(context, logger)
        {
            _includeService = includeService;
            _filterService = filterService;
        }

        public virtual Task<List<TEntity>> Get(
            TIncludeConfig? includeConfig = default,
            TFilterConfig? filterConfig = default)
        {
            return _context
                .Set<TEntity>()
                .IncludeConfig(_includeService, includeConfig)
                .Filter(_filterService, filterConfig)
                .ToListAsync();
        }

        public virtual Task<List<TEntity>> GetWithTracking(
            TIncludeConfig? includeConfig = default,
            TFilterConfig? filterConfig = default)
        {
            return _context
                .Set<TEntity>()
                .IncludeConfig(_includeService, includeConfig)
                .Filter(_filterService, filterConfig)
                .AsTracking()
                .ToListAsync();
        }

        public virtual Task<List<TEntity>> GetAsSplitQuery(
            TIncludeConfig? includeConfig = default,
            TFilterConfig? filterConfig = default)
        {
            return _context
                .Set<TEntity>()
                .IncludeConfig(_includeService, includeConfig)
                .Filter(_filterService, filterConfig)
                .AsSplitQuery()
                .ToListAsync();
        }

        public virtual Task<int> Count(
            TFilterConfig? filterConfig = default)
        {
            return _context
                .Set<TEntity>()
                .Filter(_filterService, filterConfig)
                .CountAsync();
        }

        public Task<TEntity?> SingleOrDefault(
            TFilterConfig? filterConfig = default)
        {
            return _context
                .Set<TEntity>()
                .Filter(_filterService, filterConfig)
                .SingleOrDefaultAsync();
        }

        public virtual Task<bool> Any(
            TFilterConfig filterConfig)
        {
            return _context
                .Set<TEntity>()
                .Filter(_filterService, filterConfig)
                .AnyAsync();
        }

        internal virtual Task<TEntity?> Get<T>(
            Guid id,
            TIncludeConfig? includeConfig,
            TFilterConfig? filterConfig)
            where T : class, TEntity, IGuidIdEntity
        {
            return _context
                .Set<T>()
                .WithId(id)
                .IncludeConfig(_includeService, includeConfig)
                .Filter(_filterService, filterConfig)
                .SingleOrDefaultAsync();
        }

        internal virtual Task<TEntity?> Get<T>(
            long id,
            TIncludeConfig? includeConfig,
            TFilterConfig? filterConfig)
            where T : class, TEntity, ILongIdEntity
        {
            return _context
                .Set<T>()
                .WithId(id)
                .IncludeConfig(_includeService, includeConfig)
                .Filter(_filterService, filterConfig)
                .SingleOrDefaultAsync();
        }

        internal virtual Task<List<TEntity>> Get<T>(
            List<Guid> id,
            TIncludeConfig? includeConfig,
            TFilterConfig? filterConfig)
            where T : class, TEntity, IGuidIdEntity
        {
            return _context
                .Set<T>()
                .WithIds(id)
                .IncludeConfig(_includeService, includeConfig)
                .Filter(_filterService, filterConfig)
                .ToListAsync();
        }

        internal virtual Task<List<TEntity>> Get<T>(
            List<long> id,
            TIncludeConfig? includeConfig,
            TFilterConfig? filterConfig)
            where T : class, TEntity, ILongIdEntity
        {
            return _context
                .Set<T>()
                .WithIds(id)
                .IncludeConfig(_includeService, includeConfig)
                .Filter(_filterService, filterConfig)
                .ToListAsync();
        }

        internal virtual async Task<List<TEntity>> GetAsSplitQuery<T>(
            List<long> id,
            TIncludeConfig? includeConfig,
            TFilterConfig? filterConfig,
            bool useTransaction)
            where T : class, TEntity, ILongIdEntity
        {
            IQueryable<TEntity> query = _context
                .Set<T>()
                .WithIds(id)
                .IncludeConfig(_includeService, includeConfig)
                .Filter(_filterService, filterConfig)
                .AsSplitQuery();

            if (useTransaction)
            {
                using IDbContextTransaction transaction = await _context.Database.BeginTransactionAsync(isolationLevel: System.Data.IsolationLevel.Snapshot);

                List<TEntity> entities = await query
                    .ToListAsync();

                await transaction.CommitAsync();

                return entities;
            }

            return await query
                .ToListAsync();
        }

        internal virtual Task<List<TEntity>> Get<T>(
            int page,
            int pageSize,
            TIncludeConfig? includeConfig,
            TFilterConfig? filterConfig)
            where T : class, ICreatedTimestampEntity, TEntity
        {
            return _context
                .Set<T>()
                .OrderByDescending(x => x.CreatedTimestamp)
                .IncludeConfig(_includeService, includeConfig)
                .Filter(_filterService, filterConfig)
                .Paginate(page, pageSize)
                .ToListAsync();
        }

        internal virtual Task<List<TEntity>> Get<T, TProperty>(
            int page,
            int pageSize,
            TIncludeConfig? includeConfig,
            TFilterConfig? filterConfig,
            Expression<Func<TEntity, TProperty>> orderBy)
            where T : class, ICreatedTimestampEntity, TEntity
        {
            return _context
                .Set<T>()
                .OrderByDescending(orderBy)
                .IncludeConfig(_includeService, includeConfig)
                .Filter(_filterService, filterConfig)
                .Paginate(page, pageSize)
                .ToListAsync();
        }

        internal virtual Task<List<TEntity>> GetAsSplitQuery<T>(
            int page,
            int pageSize,
            TIncludeConfig? includeConfig,
            TFilterConfig? filterConfig)
            where T : class, ICreatedTimestampEntity, TEntity
        {
            return _context
                .Set<T>()
                .OrderByDescending(x => x.CreatedTimestamp)
                .IncludeConfig(_includeService, includeConfig)
                .Filter(_filterService, filterConfig)
                .Paginate(page, pageSize)
                .AsSplitQuery()
                .ToListAsync();
        }

        public Task<TEntity?> SingleOrDefault(
            TFilterConfig filterConfig,
            TIncludeConfig? includeConfig = default)
        {
            return _context
                .Set<TEntity>()
                .IncludeConfig(_includeService, includeConfig)
                .Filter(_filterService, filterConfig)
                .SingleOrDefaultAsync();
        }
    }

    public static class BaseDAOExtensions
    {
        internal static IQueryable<TEntity> IncludeConfig<TEntity, TIncludeConfig>(
            this IQueryable<TEntity> query,
            IIncludeService<TEntity, TIncludeConfig> includeService,
            TIncludeConfig? includeConfig)
                where TEntity : IEntity
                where TIncludeConfig : IIncludeConfig<TEntity>
        {
            if (includeConfig != null)
            {
                query = includeService.IncludeConfig(query, includeConfig);
            }

            return query;
        }

        internal static IQueryable<TEntity> Filter<TEntity, TFilterConfig>(
            this IQueryable<TEntity> query,
            IFilterService<TEntity, TFilterConfig> filterService,
            TFilterConfig? filterConfig)
                where TEntity : IEntity
                where TFilterConfig : IFilterConfig<TEntity>
        {
            if (filterConfig != null)
            {
                query = filterService.Filter(query, filterConfig);
            }

            return query;
        }

        public static Task<TEntity?> Get<TEntity>(
            this BaseDAO<TEntity> baseDAO,
            Guid id)
                where TEntity : class, IGuidIdEntity
        {
            return baseDAO.Get<TEntity>(id);
        }

        public static Task<TEntity?> Get<TEntity>(
            this BaseDAO<TEntity> baseDAO,
            long id)
            where TEntity : class, ILongIdEntity
        {
            return baseDAO.Get<TEntity>(id);
        }

        public static Task<bool> Exists<TEntity>(
            this BaseDAO<TEntity> baseDAO,
            Guid id)
        where TEntity : class, IGuidIdEntity
        {
            return baseDAO.Exists<TEntity>(id);
        }

        public static Task<bool> Exists<TEntity>(
            this BaseDAO<TEntity> baseDAO,
            long id)
            where TEntity : class, ILongIdEntity
        {
            return baseDAO.Exists<TEntity>(id);
        }

        public static Task<TEntity?> Get<TEntity, TIncludeConfig, TFilterConfig>(
            this BaseDAO<TEntity, TIncludeConfig, TFilterConfig> baseDAO,
            Guid id,
            TIncludeConfig? includeConfig = default,
            TFilterConfig? filterConfig = default)
            where TEntity : class, IGuidIdEntity
            where TIncludeConfig : IIncludeConfig<TEntity>
            where TFilterConfig : IFilterConfig<TEntity>
        {
            return baseDAO.Get<TEntity>(id, includeConfig, filterConfig);
        }

        public static Task<TEntity?> Get<TEntity, TIncludeConfig, TFilterConfig>(
            this BaseDAO<TEntity, TIncludeConfig, TFilterConfig> baseDAO,
            long id,
            TIncludeConfig? includeConfig = default,
            TFilterConfig? filterConfig = default)
            where TEntity : class, ILongIdEntity
            where TIncludeConfig : IIncludeConfig<TEntity>
            where TFilterConfig : IFilterConfig<TEntity>
        {
            return baseDAO.Get<TEntity>(id, includeConfig, filterConfig);
        }

        public static Task<List<TEntity>> Get<TEntity, TIncludeConfig, TFilterConfig>(
            this BaseDAO<TEntity, TIncludeConfig, TFilterConfig> baseDAO,
            List<Guid> ids,
            TIncludeConfig? includeConfig = default,
            TFilterConfig? filterConfig = default)
            where TEntity : class, IGuidIdEntity
            where TIncludeConfig : IIncludeConfig<TEntity>
            where TFilterConfig : IFilterConfig<TEntity>
        {
            return baseDAO.Get<TEntity>(ids, includeConfig, filterConfig);
        }

        public static Task<List<TEntity>> Get<TEntity, TIncludeConfig, TFilterConfig>(
            this BaseDAO<TEntity, TIncludeConfig, TFilterConfig> baseDAO,
            List<long> ids,
            TIncludeConfig? includeConfig = default,
            TFilterConfig? filterConfig = default)
            where TEntity : class, ILongIdEntity
            where TIncludeConfig : IIncludeConfig<TEntity>
            where TFilterConfig : IFilterConfig<TEntity>
        {
            return baseDAO.Get<TEntity>(ids, includeConfig, filterConfig);
        }

        public static Task<List<TEntity>> GetAsSplitQuery<TEntity, TIncludeConfig, TFilterConfig>(
            this BaseDAO<TEntity, TIncludeConfig, TFilterConfig> baseDAO,
            List<long> ids,
            TIncludeConfig? includeConfig = default,
            TFilterConfig? filterConfig = default,
            bool useTransaction = false)
            where TEntity : class, ILongIdEntity
            where TIncludeConfig : IIncludeConfig<TEntity>
            where TFilterConfig : IFilterConfig<TEntity>
        {
            return baseDAO.GetAsSplitQuery<TEntity>(ids, includeConfig, filterConfig, useTransaction);
        }

        public static async Task<PaginationData<TEntity>> GetPaginated<TEntity, TIncludeConfig, TFilterConfig>(
            this BaseDAO<TEntity, TIncludeConfig, TFilterConfig> baseDAO,
            int page,
            int pageSize,
            TIncludeConfig? includeConfig = default,
            TFilterConfig? filterConfig = default)
            where TEntity : class, ICreatedTimestampEntity
            where TIncludeConfig : IIncludeConfig<TEntity>
            where TFilterConfig : IFilterConfig<TEntity>
        {
            int count = await baseDAO.Count(filterConfig);

            List<TEntity> entities = await baseDAO.Get<TEntity>(
                page: page,
                pageSize: pageSize,
                includeConfig: includeConfig,
                filterConfig: filterConfig);

            PaginationData<TEntity> data = new PaginationData<TEntity>(
                totalCount: count,
                data: entities);

            return data;
        }

        public static async Task<PaginationData<TEntity>> GetPaginated<TEntity, TIncludeConfig, TFilterConfig, TProperty>(
            this BaseDAO<TEntity, TIncludeConfig, TFilterConfig> baseDAO,
            int page,
            int pageSize,
            Expression<Func<TEntity, TProperty>> orderBy,
            TIncludeConfig? includeConfig = default,
            TFilterConfig? filterConfig = default)
            where TEntity : class, ICreatedTimestampEntity
            where TIncludeConfig : IIncludeConfig<TEntity>
            where TFilterConfig : IFilterConfig<TEntity>
        {
            int count = await baseDAO.Count(filterConfig);

            List<TEntity> entities = await baseDAO.Get<TEntity, TProperty>(
                page: page,
                pageSize: pageSize,
                includeConfig: includeConfig,
                filterConfig: filterConfig,
                orderBy: orderBy);

            PaginationData<TEntity> data = new PaginationData<TEntity>(
                totalCount: count,
                data: entities);

            return data;
        }

        public static async Task<PaginationData<TEntity>> GetPaginatedAsSplitQuery<TEntity, TIncludeConfig, TFilterConfig>(
            this BaseDAO<TEntity, TIncludeConfig, TFilterConfig> baseDAO,
            int page,
            int pageSize,
            TIncludeConfig? includeConfig = default,
            TFilterConfig? filterConfig = default)
            where TEntity : class, ICreatedTimestampEntity
            where TIncludeConfig : IIncludeConfig<TEntity>
            where TFilterConfig : IFilterConfig<TEntity>
        {
            int count = await baseDAO.Count(filterConfig);

            List<TEntity> entities = await baseDAO.GetAsSplitQuery<TEntity>(
                page: page,
                pageSize: pageSize,
                includeConfig: includeConfig,
                filterConfig: filterConfig);

            PaginationData<TEntity> data = new PaginationData<TEntity>(
                totalCount: count,
                data: entities);

            return data;
        }

        public static Task<Result> Cancel<TEntity>(
            this BaseDAO<TEntity> baseDAO,
            TEntity entity)
            where TEntity : class, ICancelledEntity
        {
            return baseDAO.Cancel(entity);
        }
    }

    public interface IIncludeService<TEntity, TIncludeConfig>
        where TIncludeConfig : IIncludeConfig<TEntity>
    {
        IQueryable<TEntity> IncludeConfig(
            IQueryable<TEntity> query,
            TIncludeConfig includeConfig);
    }

    public interface IFilterService<TEntity, TFilterConfig>
        where TFilterConfig : IFilterConfig<TEntity>
    {
        IQueryable<TEntity> Filter(
            IQueryable<TEntity> query,
            TFilterConfig filterConfig);
    }

    public interface IIncludeConfig<TEntity>
    {
    }

    public interface IFilterConfig<TEntity>
    {
    }
}
