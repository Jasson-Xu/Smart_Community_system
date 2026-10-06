using Microsoft.EntityFrameworkCore;
using SmartCommunity.Api.Models;

namespace SmartCommunity.Api.Data;

public sealed class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<AppUser> Users => Set<AppUser>();
    public DbSet<IssueCategory> Categories => Set<IssueCategory>();
    public DbSet<ReportStatus> ReportStatuses => Set<ReportStatus>();
    public DbSet<CommunityReport> Reports => Set<CommunityReport>();
    public DbSet<StatusHistoryEntry> StatusHistory => Set<StatusHistoryEntry>();
    public DbSet<ReportComment> Comments => Set<ReportComment>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        var users = modelBuilder.Entity<AppUser>();
        users.ToTable("users");
        users.HasKey(user => user.Id);
        users.Property(user => user.Id).HasColumnName("id");
        users.Property(user => user.Name).HasColumnName("name").HasMaxLength(100).IsRequired();
        users.Property(user => user.Email).HasColumnName("email").HasMaxLength(254).IsRequired();
        users.HasIndex(user => user.Email).IsUnique();
        users.Property(user => user.PasswordHash).HasColumnName("password_hash").IsRequired();
        users.Property(user => user.Role).HasColumnName("role").HasMaxLength(32).IsRequired();
        users.Property(user => user.CreatedAt).HasColumnName("created_at").IsRequired();

        var categories = modelBuilder.Entity<IssueCategory>();
        categories.ToTable("categories");
        categories.HasKey(category => category.Id);
        categories.Property(category => category.Id).HasColumnName("id");
        categories.Property(category => category.Slug).HasColumnName("slug").HasMaxLength(80).IsRequired();
        categories.HasIndex(category => category.Slug).IsUnique();
        categories.Property(category => category.Name).HasColumnName("name").HasMaxLength(100).IsRequired();
        categories.HasIndex(category => category.Name).IsUnique();
        categories.Property(category => category.Description).HasColumnName("description").HasMaxLength(240).IsRequired();
        categories.Property(category => category.SortOrder).HasColumnName("sort_order").IsRequired();
        categories.Property(category => category.IsActive).HasColumnName("is_active").IsRequired();

        var statuses = modelBuilder.Entity<ReportStatus>();
        statuses.ToTable("report_statuses");
        statuses.HasKey(status => status.Id);
        statuses.Property(status => status.Id).HasColumnName("id");
        statuses.Property(status => status.Code).HasColumnName("code").HasMaxLength(40).IsRequired();
        statuses.HasIndex(status => status.Code).IsUnique();
        statuses.Property(status => status.Name).HasColumnName("name").HasMaxLength(80).IsRequired();
        statuses.Property(status => status.SortOrder).HasColumnName("sort_order").IsRequired();

        var reports = modelBuilder.Entity<CommunityReport>();
        reports.ToTable("reports", table =>
        {
            table.HasCheckConstraint("CK_reports_latitude", "latitude IS NULL OR (latitude >= -90 AND latitude <= 90)");
            table.HasCheckConstraint("CK_reports_longitude", "longitude IS NULL OR (longitude >= -180 AND longitude <= 180)");
            table.HasCheckConstraint("CK_reports_coordinate_pair", "(latitude IS NULL AND longitude IS NULL) OR (latitude IS NOT NULL AND longitude IS NOT NULL)");
        });
        reports.HasKey(report => report.Id);
        reports.Property(report => report.Id).HasColumnName("id");
        reports.Property(report => report.ReferenceNo).HasColumnName("reference_no").HasMaxLength(32).IsRequired();
        reports.HasIndex(report => report.ReferenceNo).IsUnique();
        reports.Property(report => report.ResidentId).HasColumnName("resident_id");
        reports.HasOne(report => report.Resident).WithMany().HasForeignKey(report => report.ResidentId)
            .OnDelete(DeleteBehavior.Restrict);
        reports.HasIndex(report => new { report.ResidentId, report.SubmittedAt });
        reports.Property(report => report.CategoryId).HasColumnName("category_id");
        reports.HasOne(report => report.Category).WithMany().HasForeignKey(report => report.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);
        reports.HasIndex(report => new { report.CategoryId, report.SubmittedAt });
        reports.Property(report => report.CurrentStatusId).HasColumnName("current_status_id");
        reports.HasOne(report => report.CurrentStatus).WithMany().HasForeignKey(report => report.CurrentStatusId)
            .OnDelete(DeleteBehavior.Restrict);
        reports.HasIndex(report => new { report.CurrentStatusId, report.SubmittedAt });
        reports.Property(report => report.Description).HasColumnName("description").HasMaxLength(2000).IsRequired();
        reports.Property(report => report.Location).HasColumnName("location").HasMaxLength(300).IsRequired();
        reports.Property(report => report.Latitude).HasColumnName("latitude").HasPrecision(9, 6);
        reports.Property(report => report.Longitude).HasColumnName("longitude").HasPrecision(9, 6);
        reports.Property(report => report.GooglePlaceId).HasColumnName("google_place_id").HasMaxLength(255);
        reports.Property(report => report.SubmittedAt).HasColumnName("submitted_at").IsRequired();

        var history = modelBuilder.Entity<StatusHistoryEntry>();
        history.ToTable("status_history");
        history.HasKey(entry => entry.Id);
        history.Property(entry => entry.Id).HasColumnName("id");
        history.Property(entry => entry.ReportId).HasColumnName("report_id");
        history.HasOne(entry => entry.Report).WithMany().HasForeignKey(entry => entry.ReportId)
            .OnDelete(DeleteBehavior.Cascade);
        history.HasIndex(entry => new { entry.ReportId, entry.ChangedAt });
        history.Property(entry => entry.StatusId).HasColumnName("status_id");
        history.HasOne(entry => entry.Status).WithMany().HasForeignKey(entry => entry.StatusId)
            .OnDelete(DeleteBehavior.Restrict);
        history.Property(entry => entry.ChangedByUserId).HasColumnName("changed_by_user_id");
        history.HasOne(entry => entry.ChangedByUser).WithMany().HasForeignKey(entry => entry.ChangedByUserId)
            .OnDelete(DeleteBehavior.Restrict);
        history.Property(entry => entry.Note).HasColumnName("note").HasMaxLength(500);
        history.Property(entry => entry.ChangedAt).HasColumnName("changed_at").IsRequired();

        var comments = modelBuilder.Entity<ReportComment>();
        comments.ToTable("comments");
        comments.HasKey(comment => comment.Id);
        comments.Property(comment => comment.Id).HasColumnName("id");
        comments.Property(comment => comment.ReportId).HasColumnName("report_id");
        comments.HasOne(comment => comment.Report).WithMany().HasForeignKey(comment => comment.ReportId)
            .OnDelete(DeleteBehavior.Cascade);
        comments.HasIndex(comment => new { comment.ReportId, comment.CreatedAt });
        comments.Property(comment => comment.AuthorId).HasColumnName("author_id");
        comments.HasOne(comment => comment.Author).WithMany().HasForeignKey(comment => comment.AuthorId)
            .OnDelete(DeleteBehavior.Restrict);
        comments.Property(comment => comment.Body).HasColumnName("body").HasMaxLength(1000).IsRequired();
        comments.Property(comment => comment.CreatedAt).HasColumnName("created_at").IsRequired();

        categories.HasData(
            new IssueCategory { Id = Guid.Parse("3f8d8599-7bbd-4f05-a915-7196b552f001"), Slug = "roads-footpaths", Name = "Roads & footpaths", Description = "Potholes, cracks and access hazards", SortOrder = 10 },
            new IssueCategory { Id = Guid.Parse("3f8d8599-7bbd-4f05-a915-7196b552f002"), Slug = "street-lighting", Name = "Street lighting", Description = "Faulty or damaged public lighting", SortOrder = 20 },
            new IssueCategory { Id = Guid.Parse("3f8d8599-7bbd-4f05-a915-7196b552f003"), Slug = "waste-dumping", Name = "Waste & dumping", Description = "Illegal dumping and overflowing bins", SortOrder = 30 },
            new IssueCategory { Id = Guid.Parse("3f8d8599-7bbd-4f05-a915-7196b552f004"), Slug = "parks-facilities", Name = "Parks & facilities", Description = "Playgrounds, signs and shared spaces", SortOrder = 40 }
        );
        statuses.HasData(
            new ReportStatus { Id = Guid.Parse("7c20c2c3-45f8-4d9c-8525-593a1841a001"), Code = "SUBMITTED", Name = "Submitted", SortOrder = 10 },
            new ReportStatus { Id = Guid.Parse("7c20c2c3-45f8-4d9c-8525-593a1841a002"), Code = "UNDER_REVIEW", Name = "Under review", SortOrder = 20 },
            new ReportStatus { Id = Guid.Parse("7c20c2c3-45f8-4d9c-8525-593a1841a003"), Code = "ASSIGNED", Name = "Assigned", SortOrder = 30 },
            new ReportStatus { Id = Guid.Parse("7c20c2c3-45f8-4d9c-8525-593a1841a004"), Code = "IN_PROGRESS", Name = "In progress", SortOrder = 40 },
            new ReportStatus { Id = Guid.Parse("7c20c2c3-45f8-4d9c-8525-593a1841a005"), Code = "RESOLVED", Name = "Resolved", SortOrder = 50 },
            new ReportStatus { Id = Guid.Parse("7c20c2c3-45f8-4d9c-8525-593a1841a006"), Code = "CLOSED", Name = "Closed", SortOrder = 60 }
        );
    }
}
