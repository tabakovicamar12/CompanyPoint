using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ToDoChartService.Data;
using ToDoChartService.Models;

namespace ToDoChartService.Controllers;

[ApiController]
[Route("toDoChartService/[controller]")]
[Authorize] 
public class TasksController : ControllerBase
{
    private readonly ToDoDbContext _context;

    public TasksController(ToDoDbContext context)
    {
        _context = context;
    }

    // GET toDoChartService/tasks
    [HttpGet]
    public async Task<ActionResult<IEnumerable<TaskItem>>> GetAll()
    {
        var tasks = await _context.Tasks.ToListAsync();
        return Ok(tasks);
    }

    // GET toDoChartService/tasks/byEmployee/{employeeId}
    [HttpGet("byEmployee/{employeeId:int}")]
    public async Task<ActionResult<IEnumerable<TaskItem>>> GetByEmployee(int employeeId)
    {
        var tasks = await _context.Tasks
            .Include(t => t.TodoList)
            .Where(t => t.TodoList!.EmployeeId == employeeId)
            .ToListAsync();

        return Ok(tasks);
    }

    // POST toDoChartService/todoLists
    [HttpPost("/toDoChartService/todoLists")]
    public async Task<ActionResult<TodoList>> CreateTodoList([FromBody] CreateTodoListDto dto)
    {
        var list = new TodoList
        {
            EmployeeId = dto.EmployeeId,
            Title = dto.Title,
            CreatedAt = DateTime.UtcNow
        };

        _context.TodoLists.Add(list);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetByEmployee), new { employeeId = list.EmployeeId }, list);
    }

[HttpPost]
public async Task<ActionResult<TaskItem>> CreateTask([FromBody] CreateTaskDto dto)
{
    // 1) preveri obstoj liste
    var list = await _context.TodoLists
        .FirstOrDefaultAsync(l => l.Id == dto.TodoListId);

    if (list == null)
        return NotFound(new { message = $"TodoList {dto.TodoListId} not found." });

    // 2) ustvari task in ga pripni na listo
    var task = new TaskItem
    {
        TodoListId = list.Id,     // FK
        TodoList = list,          // navigacija (opcijsko, ampak jasno poveže)
        Title = dto.Title,
        Description = dto.Description,
        DueDate = dto.DueDate,
        Status = "Pending",
        CreatedAt = DateTime.UtcNow,
        UpdatedAt = DateTime.UtcNow
    };

    _context.Tasks.Add(task);
    await _context.SaveChangesAsync();

    // 3) vrni lokacijo na GET byEmployee (ker task pripada zaposlenemu prek liste)
    return CreatedAtAction(
        nameof(GetByEmployee),
        new { employeeId = list.EmployeeId },
        task
    );
}

    // PUT toDoChartService/tasks/{taskId}
    [HttpPut("{taskId:int}")]
    public async Task<ActionResult> UpdateTask(int taskId, [FromBody] UpdateTaskDto dto)
    {
        var task = await _context.Tasks.FindAsync(taskId);
        if (task == null) return NotFound();

        task.Title = dto.Title;
        task.Description = dto.Description;
        task.DueDate = dto.DueDate;
        task.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    // PUT toDoChartService/tasks/{taskId}/status
    [HttpPut("{taskId:int}/status")]
    public async Task<ActionResult> UpdateStatus(int taskId, [FromBody] StatusUpdateDto dto)
    {
        var task = await _context.Tasks.FindAsync(taskId);
        if (task == null) return NotFound();

        task.Status = dto.Status;
        task.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    // DELETE toDoChartService/tasks/{taskId}
    [HttpDelete("{taskId:int}")]
    public async Task<ActionResult> DeleteTask(int taskId)
    {
        var task = await _context.Tasks.FindAsync(taskId);
        if (task == null) return NotFound();

        _context.Tasks.Remove(task);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    // DELETE toDoChartService/tasks/byEmployee/{employeeId}
    [HttpDelete("byEmployee/{employeeId:int}")]
    public async Task<ActionResult> DeleteTasksByEmployee(int employeeId)
    {
        var tasks = await _context.Tasks
            .Include(t => t.TodoList)
            .Where(t => t.TodoList!.EmployeeId == employeeId)
            .ToListAsync();

        if (!tasks.Any()) return NotFound();

        _context.Tasks.RemoveRange(tasks);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    // GET toDoChartService/todoLists
    [HttpGet("/toDoChartService/todoLists")]
    public async Task<ActionResult<IEnumerable<TodoList>>> GetAllTodoLists()
    {
        var lists = await _context.TodoLists
            .Include(l => l.Tasks)
            .ToListAsync();

        return Ok(lists);
    }

    // GET toDoChartService/todoLists/{id}
    [HttpGet("/toDoChartService/todoLists/{id:int}")]
    public async Task<ActionResult<TodoList>> GetTodoListById(int id)
    {
        var list = await _context.TodoLists
            .Include(l => l.Tasks)
            .FirstOrDefaultAsync(l => l.Id == id);

        if (list == null)
            return NotFound();

        return Ok(list);
    }
    // GET toDoChartService/todoLists/byEmployee/{employeeId}
    [HttpGet("toDoListByEmployee/{employeeId:int}")]
    public async Task<ActionResult<IEnumerable<TodoList>>> GetToDoListByEmployee(int employeeId)
    {
        var lists = await _context.TodoLists
            .Include(l => l.Tasks)
            .Where(l => l.EmployeeId == employeeId)
            .OrderBy(l => l.Id)
            .ToListAsync();

        return Ok(lists);
    }


}

public class CreateTodoListDto
{
    public int EmployeeId { get; set; }
    public string Title { get; set; } = "";
}

public class CreateTaskDto
{
    public int TodoListId { get; set; }
    public string Title { get; set; } = "";
    public string Description { get; set; } = "";
    public DateTime? DueDate { get; set; }
}

public class UpdateTaskDto
{
    public string Title { get; set; } = "";
    public string Description { get; set; } = "";
    public DateTime? DueDate { get; set; }
}

public class StatusUpdateDto
{
    public string Status { get; set; } = "Pending";
}
