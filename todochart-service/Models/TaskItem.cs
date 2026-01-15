namespace ToDoChartService.Models;
using System.Text.Json.Serialization;

public class TaskItem
{
    public int Id { get; set; }
    public int TodoListId { get; set; }
    public string Title { get; set; } = "";
    public string Description { get; set; } = "";
    public string Status { get; set; } = "Pending"; // Pending/InProgress/Done
    public DateTime? DueDate { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [JsonIgnore]
    public TodoList? TodoList { get; set; }
}
