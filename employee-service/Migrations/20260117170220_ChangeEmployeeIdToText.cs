using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace EmployeeService.Migrations
{
    /// <inheritdoc />
    public partial class ChangeEmployeeIdToText : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
{
    // 1) odstrani PK (ker je vezan na stolpec)
    migrationBuilder.Sql(@"ALTER TABLE ""Employees"" DROP CONSTRAINT IF EXISTS ""PK_Employees"";");

    // 2) odstrani identity/sequence na Id (če obstaja)
    migrationBuilder.Sql(@"ALTER TABLE ""Employees"" ALTER COLUMN ""Id"" DROP IDENTITY IF EXISTS;");

    // 3) zamenjaj tip int -> text (z explicit cast)
    migrationBuilder.Sql(@"ALTER TABLE ""Employees"" ALTER COLUMN ""Id"" TYPE text USING ""Id""::text;");

    // 4) ponovno nastavi PK
    migrationBuilder.Sql(@"ALTER TABLE ""Employees"" ADD CONSTRAINT ""PK_Employees"" PRIMARY KEY (""Id"");");
}


        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<int>(
                name: "Id",
                table: "Employees",
                type: "integer",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text")
                .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn);
        }
    }
}
