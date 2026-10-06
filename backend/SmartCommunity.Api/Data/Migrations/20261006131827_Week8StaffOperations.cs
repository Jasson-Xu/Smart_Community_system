using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SmartCommunity.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class Week8StaffOperations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "priority",
                table: "reports",
                type: "character varying(16)",
                maxLength: 16,
                nullable: false,
                defaultValue: "Normal");

            migrationBuilder.CreateTable(
                name: "assignments",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    report_id = table.Column<Guid>(type: "uuid", nullable: false),
                    assigned_to_user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    assigned_by_user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    assigned_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_assignments", x => x.id);
                    table.ForeignKey(
                        name: "FK_assignments_reports_report_id",
                        column: x => x.report_id,
                        principalTable: "reports",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_assignments_users_assigned_by_user_id",
                        column: x => x.assigned_by_user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_assignments_users_assigned_to_user_id",
                        column: x => x.assigned_to_user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "duplicate_reviews",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    report_id = table.Column<Guid>(type: "uuid", nullable: false),
                    potential_duplicate_report_id = table.Column<Guid>(type: "uuid", nullable: false),
                    marked_by_user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    note = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_duplicate_reviews", x => x.id);
                    table.CheckConstraint("CK_duplicate_reviews_different_reports", "report_id <> potential_duplicate_report_id");
                    table.ForeignKey(
                        name: "FK_duplicate_reviews_reports_potential_duplicate_report_id",
                        column: x => x.potential_duplicate_report_id,
                        principalTable: "reports",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_duplicate_reviews_reports_report_id",
                        column: x => x.report_id,
                        principalTable: "reports",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_duplicate_reviews_users_marked_by_user_id",
                        column: x => x.marked_by_user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.AddCheckConstraint(
                name: "CK_reports_priority",
                table: "reports",
                sql: "priority IN ('Low', 'Normal', 'High', 'Urgent')");

            migrationBuilder.CreateIndex(
                name: "IX_assignments_assigned_by_user_id",
                table: "assignments",
                column: "assigned_by_user_id");

            migrationBuilder.CreateIndex(
                name: "IX_assignments_assigned_to_user_id_assigned_at",
                table: "assignments",
                columns: new[] { "assigned_to_user_id", "assigned_at" });

            migrationBuilder.CreateIndex(
                name: "IX_assignments_report_id_assigned_at",
                table: "assignments",
                columns: new[] { "report_id", "assigned_at" });

            migrationBuilder.CreateIndex(
                name: "IX_duplicate_reviews_marked_by_user_id",
                table: "duplicate_reviews",
                column: "marked_by_user_id");

            migrationBuilder.CreateIndex(
                name: "IX_duplicate_reviews_potential_duplicate_report_id",
                table: "duplicate_reviews",
                column: "potential_duplicate_report_id");

            migrationBuilder.CreateIndex(
                name: "IX_duplicate_reviews_report_id_potential_duplicate_report_id",
                table: "duplicate_reviews",
                columns: new[] { "report_id", "potential_duplicate_report_id" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "assignments");

            migrationBuilder.DropTable(
                name: "duplicate_reviews");

            migrationBuilder.DropCheckConstraint(
                name: "CK_reports_priority",
                table: "reports");

            migrationBuilder.DropColumn(
                name: "priority",
                table: "reports");
        }
    }
}
