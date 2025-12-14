using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Reflection.Emit;
using ToDoChartService.Models;

namespace ToDoChartService.Data;

public class ToDoDbContext : DbContext
{
    public ToDoDbContext(DbContextOptions<ToDoDbContext> options)
        : base(options)
    {
    }

    public DbSet<TodoList> TodoLists => Set<TodoList>();
    public DbSet<TaskItem> Tasks => Set<TaskItem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<TaskItem>()
            .HasOne(t => t.TodoList)
            .WithMany(l => l.Tasks)
            .HasForeignKey(t => t.TodoListId);
    }
}
