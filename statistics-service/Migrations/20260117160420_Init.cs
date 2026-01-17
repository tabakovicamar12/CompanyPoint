using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace StatisticsService.Migrations
{
    /// <inheritdoc />
    public partial class Init : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "EndpointCalls",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Endpoint = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: false),
                    CalledAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EndpointCalls", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_EndpointCalls_CalledAt",
                table: "EndpointCalls",
                column: "CalledAt");

            migrationBuilder.CreateIndex(
                name: "IX_EndpointCalls_Endpoint",
                table: "EndpointCalls",
                column: "Endpoint");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "EndpointCalls");
        }
    }
}
