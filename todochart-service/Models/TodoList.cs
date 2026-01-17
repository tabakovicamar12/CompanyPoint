namespace ToDoChartService.Models;

public class TodoList
{
    public int Id { get; set; }
    public string  EmployeeId { get; set; }        // referenca na EmployeeService
    public string Title { get; set; } = "";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public List<TaskItem> Tasks { get; set; } = new();
}
