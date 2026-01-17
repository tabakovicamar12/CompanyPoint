namespace EmployeeService.Models;

public class Employee
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string FirstName { get; set; } = "";
    public string LastName { get; set; } = "";
    public string Email { get; set; } = "";
    public string Position { get; set; } = "";
    public string Department { get; set; } = "";
    public string Status { get; set; } = "Active";  // Active / Inactive
    public DateTime HireDate { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
