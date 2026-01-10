namespace ToDoChartService.Logging;

public class RequestLoggingMiddleware
{
    private readonly RequestDelegate _next;

    public RequestLoggingMiddleware(RequestDelegate next) => _next = next;

    public async Task Invoke(HttpContext ctx, RabbitMqLogPublisher publisher)
    {
        var cid = CorrelationIdMiddleware.Get(ctx);
        var url = $"{ctx.Request.Path}{ctx.Request.QueryString}";
        var service = "ToDoChartService";

        // pred obdelavo
        publisher.Publish(new LogEvent(
            TimestampUtc: DateTime.UtcNow,
            Level: "INFO",
            Url: url,
            CorrelationId: cid,
            Service: service,
            Message: $"* {ctx.Request.Method} request *"
        ));

        try
        {
            await _next(ctx);

            publisher.Publish(new LogEvent(
                TimestampUtc: DateTime.UtcNow,
                Level: "INFO",
                Url: url,
                CorrelationId: cid,
                Service: service,
                Message: $"Response {ctx.Response.StatusCode}"
            ));
        }
        catch (Exception ex)
        {
            publisher.Publish(new LogEvent(
                TimestampUtc: DateTime.UtcNow,
                Level: "ERROR",
                Url: url,
                CorrelationId: cid,
                Service: service,
                Message: $"Exception: {ex.GetType().Name}: {ex.Message}"
            ));
            throw;
        }
    }
}
