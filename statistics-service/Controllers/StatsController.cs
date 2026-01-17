using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StatisticsService.Data;
using StatisticsService.Dtos;
using StatisticsService.Models;

namespace StatisticsService.Controllers;

[ApiController]
[Authorize]
[Route("stats")]
public class StatsController : ControllerBase
{
    private readonly StatsDbContext _db;

    public StatsController(StatsDbContext db)
    {
        _db = db;
    }

    [HttpPost]
    public async Task<IActionResult> Track([FromBody] TrackRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.KlicanaStoritev))
            return BadRequest("klicanaStoritev is required.");

        _db.EndpointCalls.Add(new EndpointCall
        {
            Endpoint = req.KlicanaStoritev.Trim(),
            CalledAt = DateTime.UtcNow
        });

        await _db.SaveChangesAsync();
        return Ok();
    }

    [HttpGet("last")]
    public async Task<IActionResult> Last()
    {
        var last = await _db.EndpointCalls
            .OrderByDescending(x => x.CalledAt)
            .Select(x => new { endpoint = x.Endpoint, calledAt = x.CalledAt })
            .FirstOrDefaultAsync();

        return Ok(last);
    }

    [HttpGet("top")]
    public async Task<IActionResult> Top()
    {
        var top = await _db.EndpointCalls
            .GroupBy(x => x.Endpoint)
            .Select(g => new { endpoint = g.Key, count = g.Count() })
            .OrderByDescending(x => x.count)
            .FirstOrDefaultAsync();

        return Ok(top);
    }

    [HttpGet("counts")]
    public async Task<IActionResult> Counts()
    {
        var counts = await _db.EndpointCalls
            .GroupBy(x => x.Endpoint)
            .Select(g => new { endpoint = g.Key, count = g.Count() })
            .OrderByDescending(x => x.count)
            .ToListAsync();

        return Ok(counts);
    }
}
