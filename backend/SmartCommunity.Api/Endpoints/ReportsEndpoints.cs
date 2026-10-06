using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using SmartCommunity.Api.Data;
using SmartCommunity.Api.Models;

namespace SmartCommunity.Api.Endpoints;

public static class ReportsEndpoints
{
    public static IEndpointRouteBuilder MapReportsEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet("/api/v1/categories", async (AppDbContext db) =>
            Results.Ok(await db.Categories.AsNoTracking().Where(category => category.IsActive)
                .OrderBy(category => category.SortOrder)
                .Select(category => new CategoryResponse(category.Id, category.Slug, category.Name, category.Description))
                .ToListAsync()));

        var reports = endpoints.MapGroup("/api/v1/reports")
            .RequireAuthorization(policy => policy.RequireRole(Roles.Resident));

        reports.MapPost("/", CreateReport);
        reports.MapGet("/", ListReports);
        reports.MapGet("/{reference}", GetReport);
        reports.MapGet("/{reference}/comments", ListComments);
        reports.MapPost("/{reference}/comments", CreateComment);
        endpoints.MapGet("/api/v1/resident/dashboard", GetDashboard)
            .RequireAuthorization(policy => policy.RequireRole(Roles.Resident));
        return endpoints;
    }

    private static async Task<IResult> CreateReport(CreateReportRequest request, ClaimsPrincipal principal, AppDbContext db)
    {
        if (!TryGetUserId(principal, out var residentId)) return Results.Unauthorized();
        var description = request.Description?.Trim() ?? "";
        var location = request.Location?.Trim() ?? "";
        var errors = new Dictionary<string, string[]>();
        if (request.CategoryId is null)
            errors["categoryId"] = ["Select an issue category."];
        if (description.Length is < 20 or > 2000)
            errors["description"] = ["Describe the issue using 20 to 2,000 characters."];
        if (location.Length is < 3 or > 300)
            errors["location"] = ["Enter a location using 3 to 300 characters."];
        if (request.Latitude.HasValue != request.Longitude.HasValue)
            errors["coordinates"] = ["Latitude and longitude must be provided together."];
        if (request.Latitude is < -90 or > 90)
            errors["coordinates"] = ["Latitude must be between -90 and 90."];
        if (request.Longitude is < -180 or > 180)
            errors["coordinates"] = ["Longitude must be between -180 and 180."];
        if (request.GooglePlaceId?.Length > 255)
            errors["googlePlaceId"] = ["The selected Google place identifier is invalid."];
        if (errors.Count > 0) return Results.ValidationProblem(errors);

        var category = await db.Categories.AsNoTracking()
            .SingleOrDefaultAsync(item => item.Id == request.CategoryId && item.IsActive);
        if (category is null)
            return Results.ValidationProblem(new Dictionary<string, string[]>
                { ["categoryId"] = ["Select an active issue category."] });
        var submittedStatus = await db.ReportStatuses.AsNoTracking()
            .SingleAsync(status => status.Code == "SUBMITTED");
        var now = DateTimeOffset.UtcNow;
        var reportId = Guid.NewGuid();
        var report = new CommunityReport
        {
            Id = reportId,
            ReferenceNo = $"SC-{now:yyyy}-{reportId:N}"[..20].ToUpperInvariant(),
            ResidentId = residentId,
            CategoryId = category.Id,
            CurrentStatusId = submittedStatus.Id,
            Description = description,
            Location = location,
            Latitude = request.Latitude,
            Longitude = request.Longitude,
            GooglePlaceId = string.IsNullOrWhiteSpace(request.GooglePlaceId) ? null : request.GooglePlaceId.Trim(),
            SubmittedAt = now
        };
        db.Reports.Add(report);
        db.StatusHistory.Add(new StatusHistoryEntry
        {
            Id = Guid.NewGuid(), ReportId = report.Id, StatusId = submittedStatus.Id,
            ChangedByUserId = residentId, ChangedAt = now, Note = "Report submitted"
        });
        await db.SaveChangesAsync();
        var response = new ReportDetailResponse(report.ReferenceNo, category.Name, category.Slug,
            report.Description, report.Location, report.Latitude, report.Longitude, report.GooglePlaceId,
            report.Priority, submittedStatus.Code, submittedStatus.Name, report.SubmittedAt,
            [new StatusHistoryResponse(submittedStatus.Name, now, "Report submitted")]);
        return Results.Created($"/api/v1/reports/{report.ReferenceNo}", response);
    }

    private static async Task<IResult> ListReports(string? status, string? sort, ClaimsPrincipal principal, AppDbContext db)
    {
        if (!TryGetUserId(principal, out var residentId)) return Results.Unauthorized();
        var query = db.Reports.AsNoTracking().Where(report => report.ResidentId == residentId);
        if (!string.IsNullOrWhiteSpace(status))
        {
            var statusCode = status.Trim().ToUpperInvariant();
            if (!await db.ReportStatuses.AnyAsync(item => item.Code == statusCode))
                return Results.ValidationProblem(new Dictionary<string, string[]>
                    { ["status"] = ["Select a valid report status."] });
            query = query.Where(report => report.CurrentStatus.Code == statusCode);
        }

        query = sort?.Trim().ToLowerInvariant() switch
        {
            "oldest" => query.OrderBy(report => report.SubmittedAt),
            "status" => query.OrderBy(report => report.CurrentStatus.SortOrder)
                .ThenByDescending(report => report.SubmittedAt),
            _ => query.OrderByDescending(report => report.SubmittedAt)
        };
        return Results.Ok(await query
            .Select(report => new ReportSummaryResponse(report.ReferenceNo, report.Category.Name,
                report.Location, report.Latitude, report.Longitude, report.Priority, report.CurrentStatus.Code,
                report.CurrentStatus.Name, report.SubmittedAt))
            .ToListAsync());
    }

    private static async Task<IResult> GetReport(string reference, ClaimsPrincipal principal, AppDbContext db)
    {
        if (!TryGetUserId(principal, out var residentId)) return Results.Unauthorized();
        var normalisedReference = reference.Trim().ToUpperInvariant();
        var report = await db.Reports.AsNoTracking()
            .Where(item => item.ResidentId == residentId && item.ReferenceNo == normalisedReference)
            .Select(item => new ReportDetailResponse(item.ReferenceNo, item.Category.Name, item.Category.Slug,
                item.Description, item.Location, item.Latitude, item.Longitude, item.GooglePlaceId,
                item.Priority, item.CurrentStatus.Code, item.CurrentStatus.Name, item.SubmittedAt,
                db.StatusHistory.Where(history => history.ReportId == item.Id)
                    .OrderBy(history => history.ChangedAt)
                    .Select(history => new StatusHistoryResponse(history.Status.Name, history.ChangedAt, history.Note))
                    .ToList()))
            .SingleOrDefaultAsync();
        return report is null ? Results.NotFound(new { message = "Report not found." }) : Results.Ok(report);
    }

    private static async Task<IResult> GetDashboard(ClaimsPrincipal principal, AppDbContext db)
    {
        if (!TryGetUserId(principal, out var residentId)) return Results.Unauthorized();
        var statusCounts = await db.ReportStatuses.AsNoTracking().OrderBy(status => status.SortOrder)
            .Select(status => new StatusCountResponse(status.Code, status.Name,
                db.Reports.Count(report => report.ResidentId == residentId && report.CurrentStatusId == status.Id)))
            .ToListAsync();
        var recentReports = await db.Reports.AsNoTracking().Where(report => report.ResidentId == residentId)
            .OrderByDescending(report => report.SubmittedAt).Take(5)
            .Select(report => new ReportSummaryResponse(report.ReferenceNo, report.Category.Name,
                report.Location, report.Latitude, report.Longitude, report.Priority, report.CurrentStatus.Code,
                report.CurrentStatus.Name, report.SubmittedAt))
            .ToListAsync();
        return Results.Ok(new ResidentDashboardResponse(statusCounts.Sum(status => status.Count),
            statusCounts, recentReports));
    }

    private static async Task<IResult> ListComments(string reference, ClaimsPrincipal principal, AppDbContext db)
    {
        if (!TryGetUserId(principal, out var residentId)) return Results.Unauthorized();
        var normalisedReference = reference.Trim().ToUpperInvariant();
        var reportId = await db.Reports.AsNoTracking()
            .Where(report => report.ResidentId == residentId && report.ReferenceNo == normalisedReference)
            .Select(report => (Guid?)report.Id).SingleOrDefaultAsync();
        if (reportId is null) return Results.NotFound(new { message = "Report not found." });
        return Results.Ok(await db.Comments.AsNoTracking().Where(comment => comment.ReportId == reportId)
            .OrderBy(comment => comment.CreatedAt)
            .Select(comment => new CommentResponse(comment.Id, comment.Author.Name, comment.Body, comment.CreatedAt))
            .ToListAsync());
    }

    private static async Task<IResult> CreateComment(string reference, CreateCommentRequest request,
        ClaimsPrincipal principal, AppDbContext db)
    {
        if (!TryGetUserId(principal, out var residentId)) return Results.Unauthorized();
        var body = request.Body?.Trim() ?? "";
        if (body.Length is < 2 or > 1000)
            return Results.ValidationProblem(new Dictionary<string, string[]>
                { ["body"] = ["Enter a comment using 2 to 1,000 characters."] });
        var normalisedReference = reference.Trim().ToUpperInvariant();
        var reportId = await db.Reports.AsNoTracking()
            .Where(report => report.ResidentId == residentId && report.ReferenceNo == normalisedReference)
            .Select(report => (Guid?)report.Id).SingleOrDefaultAsync();
        if (reportId is null) return Results.NotFound(new { message = "Report not found." });
        var comment = new ReportComment
        {
            Id = Guid.NewGuid(), ReportId = reportId.Value, AuthorId = residentId,
            Body = body, CreatedAt = DateTimeOffset.UtcNow
        };
        db.Comments.Add(comment);
        await db.SaveChangesAsync();
        var authorName = principal.FindFirstValue(ClaimTypes.Name) ?? "Resident";
        return Results.Created($"/api/v1/reports/{normalisedReference}/comments/{comment.Id}",
            new CommentResponse(comment.Id, authorName, comment.Body, comment.CreatedAt));
    }

    private static bool TryGetUserId(ClaimsPrincipal principal, out Guid userId) =>
        Guid.TryParse(principal.FindFirstValue(ClaimTypes.NameIdentifier), out userId);
}

public record CategoryResponse(Guid Id, string Slug, string Name, string Description);
public record CreateReportRequest(Guid? CategoryId, string? Description, string? Location,
    decimal? Latitude, decimal? Longitude, string? GooglePlaceId);
public record ReportSummaryResponse(string Reference, string Category, string Location,
    decimal? Latitude, decimal? Longitude, string Priority, string StatusCode, string Status, DateTimeOffset SubmittedAt);
public record StatusHistoryResponse(string Status, DateTimeOffset ChangedAt, string? Note);
public record ReportDetailResponse(string Reference, string Category, string CategorySlug, string Description,
    string Location, decimal? Latitude, decimal? Longitude, string? GooglePlaceId,
    string Priority, string StatusCode, string Status, DateTimeOffset SubmittedAt,
    IReadOnlyList<StatusHistoryResponse> History);
public record StatusCountResponse(string Code, string Name, int Count);
public record ResidentDashboardResponse(int TotalReports, IReadOnlyList<StatusCountResponse> StatusCounts,
    IReadOnlyList<ReportSummaryResponse> RecentReports);
public record CreateCommentRequest(string? Body);
public record CommentResponse(Guid Id, string AuthorName, string Body, DateTimeOffset CreatedAt);
