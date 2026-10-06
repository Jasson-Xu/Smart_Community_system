using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace SmartCommunity.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class Week5Reports : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "categories",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    slug = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    description = table.Column<string>(type: "character varying(240)", maxLength: 240, nullable: false),
                    sort_order = table.Column<int>(type: "integer", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_categories", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "report_statuses",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    code = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    name = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    sort_order = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_report_statuses", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "reports",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    reference_no = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    resident_id = table.Column<Guid>(type: "uuid", nullable: false),
                    category_id = table.Column<Guid>(type: "uuid", nullable: false),
                    current_status_id = table.Column<Guid>(type: "uuid", nullable: false),
                    description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    location = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    submitted_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_reports", x => x.id);
                    table.ForeignKey(
                        name: "FK_reports_categories_category_id",
                        column: x => x.category_id,
                        principalTable: "categories",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_reports_report_statuses_current_status_id",
                        column: x => x.current_status_id,
                        principalTable: "report_statuses",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_reports_users_resident_id",
                        column: x => x.resident_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "status_history",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    report_id = table.Column<Guid>(type: "uuid", nullable: false),
                    status_id = table.Column<Guid>(type: "uuid", nullable: false),
                    changed_by_user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    note = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    changed_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_status_history", x => x.id);
                    table.ForeignKey(
                        name: "FK_status_history_report_statuses_status_id",
                        column: x => x.status_id,
                        principalTable: "report_statuses",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_status_history_reports_report_id",
                        column: x => x.report_id,
                        principalTable: "reports",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_status_history_users_changed_by_user_id",
                        column: x => x.changed_by_user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.InsertData(
                table: "categories",
                columns: new[] { "id", "description", "is_active", "name", "slug", "sort_order" },
                values: new object[,]
                {
                    { new Guid("3f8d8599-7bbd-4f05-a915-7196b552f001"), "Potholes, cracks and access hazards", true, "Roads & footpaths", "roads-footpaths", 10 },
                    { new Guid("3f8d8599-7bbd-4f05-a915-7196b552f002"), "Faulty or damaged public lighting", true, "Street lighting", "street-lighting", 20 },
                    { new Guid("3f8d8599-7bbd-4f05-a915-7196b552f003"), "Illegal dumping and overflowing bins", true, "Waste & dumping", "waste-dumping", 30 },
                    { new Guid("3f8d8599-7bbd-4f05-a915-7196b552f004"), "Playgrounds, signs and shared spaces", true, "Parks & facilities", "parks-facilities", 40 }
                });

            migrationBuilder.InsertData(
                table: "report_statuses",
                columns: new[] { "id", "code", "name", "sort_order" },
                values: new object[,]
                {
                    { new Guid("7c20c2c3-45f8-4d9c-8525-593a1841a001"), "SUBMITTED", "Submitted", 10 },
                    { new Guid("7c20c2c3-45f8-4d9c-8525-593a1841a002"), "UNDER_REVIEW", "Under review", 20 },
                    { new Guid("7c20c2c3-45f8-4d9c-8525-593a1841a003"), "ASSIGNED", "Assigned", 30 },
                    { new Guid("7c20c2c3-45f8-4d9c-8525-593a1841a004"), "IN_PROGRESS", "In progress", 40 },
                    { new Guid("7c20c2c3-45f8-4d9c-8525-593a1841a005"), "RESOLVED", "Resolved", 50 },
                    { new Guid("7c20c2c3-45f8-4d9c-8525-593a1841a006"), "CLOSED", "Closed", 60 }
                });

            migrationBuilder.CreateIndex(
                name: "IX_categories_name",
                table: "categories",
                column: "name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_categories_slug",
                table: "categories",
                column: "slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_report_statuses_code",
                table: "report_statuses",
                column: "code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_reports_category_id_submitted_at",
                table: "reports",
                columns: new[] { "category_id", "submitted_at" });

            migrationBuilder.CreateIndex(
                name: "IX_reports_current_status_id_submitted_at",
                table: "reports",
                columns: new[] { "current_status_id", "submitted_at" });

            migrationBuilder.CreateIndex(
                name: "IX_reports_reference_no",
                table: "reports",
                column: "reference_no",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_reports_resident_id_submitted_at",
                table: "reports",
                columns: new[] { "resident_id", "submitted_at" });

            migrationBuilder.CreateIndex(
                name: "IX_status_history_changed_by_user_id",
                table: "status_history",
                column: "changed_by_user_id");

            migrationBuilder.CreateIndex(
                name: "IX_status_history_report_id_changed_at",
                table: "status_history",
                columns: new[] { "report_id", "changed_at" });

            migrationBuilder.CreateIndex(
                name: "IX_status_history_status_id",
                table: "status_history",
                column: "status_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "status_history");

            migrationBuilder.DropTable(
                name: "reports");

            migrationBuilder.DropTable(
                name: "categories");

            migrationBuilder.DropTable(
                name: "report_statuses");
        }
    }
}
