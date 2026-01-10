using EmployeeService.Data;
using EmployeeService.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using EmployeeService.Logging;

namespace EmployeeService.Controllers;

[ApiController]
[Authorize]
[Route("employeeService/[controller]")]
public class EmployeesController : ControllerBase
{
    private readonly EmployeeDbContext _context;

    private readonly RabbitMqLogPublisher _log;

    public EmployeesController(EmployeeDbContext context, RabbitMqLogPublisher log)
    {
        _context = context;
        _log = log;
    }

    // GET  employeeService/employees
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Employee>>> GetAll()
    {

        var cid = HttpContext.Items["X-Correlation-Id"]?.ToString();

        _log.Publish(new
        {
            timestamp = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss,fff"),
            level = "INFO",
            url = $"{Request.Scheme}://{Request.Host}{Request.Path}",
            correlationId = cid,
            service = "EmployeeService",
            message = "GET employees"
        });


        var employees = await _context.Employees.ToListAsync();
        return Ok(employees);
    }

    // GET  employeeService/employees/{id}
    [HttpGet("{id:int}")]
    public async Task<ActionResult<Employee>> GetById(int id)
    {
        var emp = await _context.Employees.FindAsync(id);
        if (emp == null) return NotFound();
        return Ok(emp);
    }

    // POST employeeService/employees
    [HttpPost]
    public async Task<ActionResult<Employee>> Create(Employee employee)
    {
        employee.HireDate = DateTime.UtcNow;
        employee.UpdatedAt = DateTime.UtcNow;

        _context.Employees.Add(employee);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = employee.Id }, employee);
    }

    // POST employeeService/employees/bulkImport
    [HttpPost("bulkImport")]
    public async Task<ActionResult> BulkImport(List<Employee> employees)
    {
        foreach (var e in employees)
        {
            e.HireDate = DateTime.UtcNow;
            e.UpdatedAt = DateTime.UtcNow;
        }

        _context.Employees.AddRange(employees);
        await _context.SaveChangesAsync();
        return Ok(new { Count = employees.Count });
    }

    // PUT employeeService/employees/{id}
    [HttpPut("{id:int}")]
    public async Task<ActionResult> Update(int id, Employee updated)
    {
        if (id != updated.Id)
            return BadRequest("Id mismatch.");

        var existing = await _context.Employees.FindAsync(id);
        if (existing == null) return NotFound();

        existing.FirstName = updated.FirstName;
        existing.LastName = updated.LastName;
        existing.Email = updated.Email;
        existing.Position = updated.Position;
        existing.Department = updated.Department;
        existing.Status = updated.Status;
        existing.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    // PUT employeeService/employees/{id}/role
    [HttpPut("{id:int}/role")]
    public async Task<ActionResult> UpdateRole(int id, [FromBody] RoleUpdateDto dto)
    {
        var existing = await _context.Employees.FindAsync(id);
        if (existing == null) return NotFound();

        existing.Position = dto.Position;
        existing.Department = dto.Department;
        existing.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    // DELETE employeeService/employees/{id}
    [HttpDelete("{id:int}")]
    public async Task<ActionResult> Delete(int id)
    {
        var existing = await _context.Employees.FindAsync(id);
        if (existing == null) return NotFound();

        _context.Employees.Remove(existing);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    // DELETE employeeService/employees/byDepartment/{department}
    [HttpDelete("byDepartment/{department}")]
    public async Task<ActionResult> DeleteByDepartment(string department)
    {
        var employees = await _context.Employees
            .Where(e => e.Department == department)
            .ToListAsync();

        if (!employees.Any()) return NotFound();

        _context.Employees.RemoveRange(employees);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}

public class RoleUpdateDto
{
    public string Position { get; set; } = "";
    public string Department { get; set; } = "";
}
