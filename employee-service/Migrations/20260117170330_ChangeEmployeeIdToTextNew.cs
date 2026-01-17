using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EmployeeService.Migrations
{
    /// <inheritdoc />
    public partial class ChangeEmployeeIdToTextNew : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"ALTER TABLE ""Employees"" DROP CONSTRAINT IF EXISTS ""PK_Employees"";");
            migrationBuilder.Sql(@"ALTER TABLE ""Employees"" ALTER COLUMN ""Id"" TYPE text USING ""Id""::text;");
            migrationBuilder.Sql(@"ALTER TABLE ""Employees"" ADD CONSTRAINT ""PK_Employees"" PRIMARY KEY (""Id"");");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {

        }
    }
}
