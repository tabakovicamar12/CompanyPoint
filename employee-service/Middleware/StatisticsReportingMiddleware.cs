using System.Net.Http.Json;

namespace EmployeeService.Middleware;

public class StatisticsReportingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<StatisticsReportingMiddleware> _logger;

    public StatisticsReportingMiddleware(
        RequestDelegate next,
        IHttpClientFactory httpClientFactory,
        ILogger<StatisticsReportingMiddleware> logger)
    {
        _next = next;
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    public async Task Invoke(HttpContext context)
    {
        await _next(context);

        // samo uspešni requesti
        if (context.Response.StatusCode < 200 || context.Response.StatusCode >= 400)
            return;

        var path = context.Request.Path.Value ?? "";
        if (string.IsNullOrWhiteSpace(path))
            return;

        // ne štej swagger / noise
        if (path.StartsWith("/swagger", StringComparison.OrdinalIgnoreCase) ||
            path.Equals("/favicon.ico", StringComparison.OrdinalIgnoreCase))
            return;

        var baseUrl = Environment.GetEnvironmentVariable("STATISTICS_URL");
        if (string.IsNullOrWhiteSpace(baseUrl))
            return;

        // posreduj isti token naprej (statistics-service je zdaj [Authorize])
        var auth = context.Request.Headers["Authorization"].FirstOrDefault();
        if (string.IsNullOrWhiteSpace(auth) || !auth.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
            return;

        try
        {
            var client = _httpClientFactory.CreateClient("Statistics");
            client.Timeout = TimeSpan.FromSeconds(2);

            var req = new HttpRequestMessage(HttpMethod.Post, "/stats");
            req.Headers.TryAddWithoutValidation("Authorization", auth);

            req.Content = JsonContent.Create(new
            {
                klicanaStoritev = $"{context.Request.Method} {path}"
            });

            await client.SendAsync(req);
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "Statistics reporting failed.");
        }

    }
}
