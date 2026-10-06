using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SmartCommunity.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class Week10NotificationsFeedback : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "report_feedback",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    report_id = table.Column<Guid>(type: "uuid", nullable: false),
                    resident_id = table.Column<Guid>(type: "uuid", nullable: false),
                    rating = table.Column<int>(type: "integer", nullable: false),
                    comment = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    submitted_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_report_feedback", x => x.id);
                    table.CheckConstraint("CK_report_feedback_rating", "rating >= 1 AND rating <= 5");
                    table.ForeignKey(
                        name: "FK_report_feedback_reports_report_id",
                        column: x => x.report_id,
                        principalTable: "reports",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_report_feedback_users_resident_id",
                        column: x => x.resident_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "report_notifications",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    recipient_id = table.Column<Guid>(type: "uuid", nullable: false),
                    report_id = table.Column<Guid>(type: "uuid", nullable: false),
                    status_history_id = table.Column<Guid>(type: "uuid", nullable: false),
                    status_code = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    read_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_report_notifications", x => x.id);
                    table.ForeignKey(
                        name: "FK_report_notifications_reports_report_id",
                        column: x => x.report_id,
                        principalTable: "reports",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_report_notifications_status_history_status_history_id",
                        column: x => x.status_history_id,
                        principalTable: "status_history",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_report_notifications_users_recipient_id",
                        column: x => x.recipient_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_report_feedback_report_id",
                table: "report_feedback",
                column: "report_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_report_feedback_resident_id",
                table: "report_feedback",
                column: "resident_id");

            migrationBuilder.CreateIndex(
                name: "IX_report_notifications_recipient_id_created_at",
                table: "report_notifications",
                columns: new[] { "recipient_id", "created_at" });

            migrationBuilder.CreateIndex(
                name: "IX_report_notifications_report_id",
                table: "report_notifications",
                column: "report_id");

            migrationBuilder.CreateIndex(
                name: "IX_report_notifications_status_history_id",
                table: "report_notifications",
                column: "status_history_id",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "report_feedback");

            migrationBuilder.DropTable(
                name: "report_notifications");
        }
    }
}
