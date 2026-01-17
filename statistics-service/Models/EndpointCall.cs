namespace StatisticsService.Models;

public class EndpointCall
{
    public long Id { get; set; }
    public string Endpoint { get; set; } = "";
    public DateTime CalledAt { get; set; } = DateTime.UtcNow;
}
