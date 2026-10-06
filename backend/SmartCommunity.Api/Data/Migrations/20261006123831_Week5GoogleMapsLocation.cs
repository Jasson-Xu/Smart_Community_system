using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SmartCommunity.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class Week5GoogleMapsLocation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "google_place_id",
                table: "reports",
                type: "character varying(255)",
                maxLength: 255,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "latitude",
                table: "reports",
                type: "numeric(9,6)",
                precision: 9,
                scale: 6,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "longitude",
                table: "reports",
                type: "numeric(9,6)",
                precision: 9,
                scale: 6,
                nullable: true);

            migrationBuilder.AddCheckConstraint(
                name: "CK_reports_coordinate_pair",
                table: "reports",
                sql: "(latitude IS NULL AND longitude IS NULL) OR (latitude IS NOT NULL AND longitude IS NOT NULL)");

            migrationBuilder.AddCheckConstraint(
                name: "CK_reports_latitude",
                table: "reports",
                sql: "latitude IS NULL OR (latitude >= -90 AND latitude <= 90)");

            migrationBuilder.AddCheckConstraint(
                name: "CK_reports_longitude",
                table: "reports",
                sql: "longitude IS NULL OR (longitude >= -180 AND longitude <= 180)");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "CK_reports_coordinate_pair",
                table: "reports");

            migrationBuilder.DropCheckConstraint(
                name: "CK_reports_latitude",
                table: "reports");

            migrationBuilder.DropCheckConstraint(
                name: "CK_reports_longitude",
                table: "reports");

            migrationBuilder.DropColumn(
                name: "google_place_id",
                table: "reports");

            migrationBuilder.DropColumn(
                name: "latitude",
                table: "reports");

            migrationBuilder.DropColumn(
                name: "longitude",
                table: "reports");
        }
    }
}
