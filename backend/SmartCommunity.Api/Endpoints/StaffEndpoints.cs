using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using SmartCommunity.Api.Data;
using SmartCommunity.Api.Models;

namespace SmartCommunity.Api.Endpoints;

public static class StaffEndpoints
{
    private static readonly Dictionary<string, string> AllowedTransitions = new(StringComparer.OrdinalIgnoreCase)
    {
        ["SUBMITTED"] = "UNDER_REVIEW",
        ["UNDER_REVIEW"] = "ASSIGNED",
        ["ASSIGNED"] = "IN_PROGRESS",
        ["IN_PROGRESS"] = "RESOLVED",
        ["RESOLVED"] = "CLOSED"
    };

    public static IEndpointRouteBuilder MapStaffEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var staff = endpoints.MapGroup("/api/v1/staff")
            .RequireAuthorization(policy => policy.RequireRole(Roles.Staff, Roles.Administrator));
        staff.MapGet("/dashboard", GetDashboard);
        staff.MapGet("/users", GetAssignableUsers);
        staff.MapGet("/reports", ListReports);
        staff.MapGet("/reports/{reference}", GetReport);
        staff.MapPatch("/reports/{reference}/priority", UpdatePriority);
        staff.MapPost("/reports/{reference}/assignments", AssignReport);
        staff.MapPost("/reports/{reference}/status", UpdateStatus);
        staff.MapPost("/reports/{reference}/comments", AddComment);
        staff.MapPost("/reports/{reference}/duplicates", MarkDuplicate);
        return endpoints;
    }

    private static async Task<IResult> GetDashboard(AppDbContext db)
    {
        var statusCounts = await db.ReportStatuses.AsNoTracking().OrderBy(status => status.SortOrder)
            .Select(status => new StaffCountResponse(status.Code, status.Name,
                db.Reports.Count(report => report.CurrentStatusId == status.Id))).ToListAsync();
        var priorityCounts = await db.Reports.AsNoTracking()
            .Where(report => report.CurrentStatus.Code != "CLOSED")
            .GroupBy(report => report.Priority)
            .Select(group => new StaffCountResponse(group.Key, group.Key, group.Count())).ToListAsync();
        var recentSource = db.Reports.AsNoTracking().OrderByDescending(report => report.SubmittedAt).Take(8);
        var recentReports = await StaffSummaryQuery(db, recentSource).ToListAsync();
        var totalReports = statusCounts.Where(status => status.Code != "CLOSED").Sum(status => status.Count);
        var unassignedReports = await db.Reports.CountAsync(report => report.CurrentStatus.Code != "CLOSED" &&
            !db.Assignments.Any(item => item.ReportId == report.Id));
        return Results.Ok(new StaffDashboardResponse(totalReports, unassignedReports,
            priorityCounts.SingleOrDefault(item => item.Code == ReportPriorities.Urgent)?.Count ?? 0,
            statusCounts, priorityCounts, recentReports));
    }

    private static async Task<IResult> GetAssignableUsers(AppDbContext db) => Results.Ok(
        await db.Users.AsNoTracking().Where(user => user.Role == Roles.Staff || user.Role == Roles.Administrator)
            .OrderBy(user => user.Name)
            .Select(user => new StaffUserResponse(user.Id, user.Name, user.Email, user.Role)).ToListAsync());

    private static async Task<IResult> ListReports(string? q, string? status, string? priority,
        Guid? assignedTo, string? sort, AppDbContext db)
    {
        var reports = db.Reports.AsNoTracking().AsQueryable();
        var search = q?.Trim();
        if (search?.Length > 100)
            return Results.ValidationProblem(new Dictionary<string, string[]> { ["q"] = ["Search text must be 100 characters or fewer."] });
        if (!string.IsNullOrWhiteSpace(search))
        {
            var lowerSearch = search.ToLower();
            reports = reports.Where(report => report.ReferenceNo.ToLower().Contains(lowerSearch) ||
                report.Location.ToLower().Contains(lowerSearch) || report.Description.ToLower().Contains(lowerSearch));
        }
        if (!string.IsNullOrWhiteSpace(status))
        {
            var statusCode = status.Trim().ToUpperInvariant();
            if (!await db.ReportStatuses.AnyAsync(item => item.Code == statusCode))
                return Results.ValidationProblem(new Dictionary<string, string[]> { ["status"] = ["Select a valid report status."] });
            reports = reports.Where(report => report.CurrentStatus.Code == statusCode);
        }
        if (!string.IsNullOrWhiteSpace(priority))
        {
            var canonicalPriority = ReportPriorities.All.FirstOrDefault(item =>
                item.Equals(priority.Trim(), StringComparison.OrdinalIgnoreCase));
            if (canonicalPriority is null)
                return Results.ValidationProblem(new Dictionary<string, string[]> { ["priority"] = ["Select a valid report priority."] });
            reports = reports.Where(report => report.Priority == canonicalPriority);
        }
        if (assignedTo.HasValue)
            reports = reports.Where(report => db.Assignments.Where(item => item.ReportId == report.Id)
                .OrderByDescending(item => item.AssignedAt).Select(item => item.AssignedToUserId)
                .FirstOrDefault() == assignedTo.Value);

        reports = sort?.Trim().ToLowerInvariant() switch
        {
            "oldest" => reports.OrderBy(report => report.SubmittedAt),
            "priority" => reports.OrderByDescending(report => report.Priority == ReportPriorities.Urgent)
                .ThenByDescending(report => report.Priority == ReportPriorities.High)
                .ThenByDescending(report => report.Priority == ReportPriorities.Normal)
                .ThenByDescending(report => report.SubmittedAt),
            "status" => reports.OrderBy(report => report.CurrentStatus.SortOrder)
                .ThenByDescending(report => report.SubmittedAt),
            _ => reports.OrderByDescending(report => report.SubmittedAt)
        };
        return Results.Ok(await StaffSummaryQuery(db, reports).ToListAsync());
    }

    private static async Task<IResult> GetReport(string reference, AppDbContext db)
    {
        var normalisedReference = NormaliseReference(reference);
        var report = await db.Reports.AsNoTracking().Where(item => item.ReferenceNo == normalisedReference)
            .Select(item => new StaffReportCore(item.Id, item.ReferenceNo, item.Resident.Name, item.Resident.Email,
                item.Category.Name, item.Description, item.Location, item.Latitude, item.Longitude,
                item.Priority, item.CurrentStatus.Code, item.CurrentStatus.Name, item.SubmittedAt)).SingleOrDefaultAsync();
        if (report is null) return Results.NotFound(new { message = "Report not found." });

        var history = await db.StatusHistory.AsNoTracking().Where(item => item.ReportId == report.Id)
            .OrderBy(item => item.ChangedAt)
            .Select(item => new StaffHistoryResponse(item.Status.Code, item.Status.Name, item.ChangedByUser.Name,
                item.Note, item.ChangedAt)).ToListAsync();
        var assignments = await db.Assignments.AsNoTracking().Where(item => item.ReportId == report.Id)
            .OrderByDescending(item => item.AssignedAt)
            .Select(item => new AssignmentResponse(item.Id, item.AssignedToUserId, item.AssignedToUser.Name,
                item.AssignedByUser.Name, item.AssignedAt)).ToListAsync();
        var comments = await db.Comments.AsNoTracking().Where(item => item.ReportId == report.Id)
            .OrderBy(item => item.CreatedAt)
            .Select(item => new StaffCommentResponse(item.Id, item.Author.Name, item.Author.Role, item.Body,
                item.CreatedAt)).ToListAsync();
        var duplicates = await db.DuplicateReviews.AsNoTracking().Where(item => item.ReportId == report.Id)
            .OrderByDescending(item => item.CreatedAt)
            .Select(item => new DuplicateResponse(item.Id, item.PotentialDuplicateReport.ReferenceNo,
                item.MarkedByUser.Name, item.Note, item.CreatedAt)).ToListAsync();
        return Results.Ok(new StaffReportDetailResponse(report.Reference, report.ResidentName, report.ResidentEmail,
            report.Category, report.Description, report.Location, report.Latitude, report.Longitude,
            report.Priority, report.StatusCode, report.Status, report.SubmittedAt,
            assignments.FirstOrDefault(), assignments, history, comments, duplicates));
    }

    private static async Task<IResult> UpdatePriority(string reference, PriorityRequest request,
        AppDbContext db)
    {
        var priority = ReportPriorities.All.FirstOrDefault(item =>
            item.Equals(request.Priority?.Trim(), StringComparison.OrdinalIgnoreCase));
        if (priority is null)
            return Results.ValidationProblem(new Dictionary<string, string[]> { ["priority"] = ["Select Low, Normal, High, or Urgent."] });
        var report = await db.Reports.SingleOrDefaultAsync(item => item.ReferenceNo == NormaliseReference(reference));
        if (report is null) return Results.NotFound(new { message = "Report not found." });
        report.Priority = priority;
        await db.SaveChangesAsync();
        return Results.Ok(new { priority });
    }

    private static async Task<IResult> AssignReport(string reference, AssignmentRequest request,
        ClaimsPrincipal principal, AppDbContext db)
    {
        if (!TryGetUserId(principal, out var actorId)) return Results.Unauthorized();
        var report = await db.Reports.AsNoTracking().SingleOrDefaultAsync(item => item.ReferenceNo == NormaliseReference(reference));
        if (report is null) return Results.NotFound(new { message = "Report not found." });
        var assignee = await db.Users.AsNoTracking().SingleOrDefaultAsync(user => user.Id == request.AssignedToUserId &&
            (user.Role == Roles.Staff || user.Role == Roles.Administrator));
        if (assignee is null)
            return Results.ValidationProblem(new Dictionary<string, string[]> { ["assignedToUserId"] = ["Select an active staff or administrator account."] });
        var assignment = new ReportAssignment
        {
            Id = Guid.NewGuid(), ReportId = report.Id, AssignedToUserId = assignee.Id,
            AssignedByUserId = actorId, AssignedAt = DateTimeOffset.UtcNow
        };
        db.Assignments.Add(assignment);
        await db.SaveChangesAsync();
        return Results.Created($"/api/v1/staff/reports/{report.ReferenceNo}",
            new AssignmentResponse(assignment.Id, assignee.Id, assignee.Name,
                principal.FindFirstValue(ClaimTypes.Name) ?? "Staff", assignment.AssignedAt));
    }

    private static async Task<IResult> UpdateStatus(string reference, StatusUpdateRequest request,
        ClaimsPrincipal principal, AppDbContext db)
    {
        if (!TryGetUserId(principal, out var actorId)) return Results.Unauthorized();
        var report = await db.Reports.Include(item => item.CurrentStatus)
            .SingleOrDefaultAsync(item => item.ReferenceNo == NormaliseReference(reference));
        if (report is null) return Results.NotFound(new { message = "Report not found." });
        var targetCode = request.StatusCode?.Trim().ToUpperInvariant() ?? "";
        if (!AllowedTransitions.TryGetValue(report.CurrentStatus.Code, out var allowedCode) || allowedCode != targetCode)
            return Results.ValidationProblem(new Dictionary<string, string[]>
                { ["statusCode"] = [$"A report in {report.CurrentStatus.Name} cannot move to the requested status."] });
        if (targetCode == "ASSIGNED" && !await db.Assignments.AnyAsync(item => item.ReportId == report.Id))
            return Results.ValidationProblem(new Dictionary<string, string[]>
                { ["statusCode"] = ["Assign the report to a staff member before moving it to Assigned."] });
        var note = request.Note?.Trim();
        if (note?.Length > 500)
            return Results.ValidationProblem(new Dictionary<string, string[]> { ["note"] = ["Status notes must be 500 characters or fewer."] });
        var targetStatus = await db.ReportStatuses.SingleAsync(item => item.Code == targetCode);
        var changedAt = DateTimeOffset.UtcNow;
        report.CurrentStatusId = targetStatus.Id;
        db.StatusHistory.Add(new StatusHistoryEntry
        {
            Id = Guid.NewGuid(), ReportId = report.Id, StatusId = targetStatus.Id,
            ChangedByUserId = actorId, Note = string.IsNullOrWhiteSpace(note) ? null : note, ChangedAt = changedAt
        });
        await db.SaveChangesAsync();
        return Results.Ok(new StaffHistoryResponse(targetStatus.Code, targetStatus.Name,
            principal.FindFirstValue(ClaimTypes.Name) ?? "Staff", note, changedAt));
    }

    private static async Task<IResult> AddComment(string reference, StaffCommentRequest request,
        ClaimsPrincipal principal, AppDbContext db)
    {
        if (!TryGetUserId(principal, out var actorId)) return Results.Unauthorized();
        var body = request.Body?.Trim() ?? "";
        if (body.Length is < 2 or > 1000)
            return Results.ValidationProblem(new Dictionary<string, string[]> { ["body"] = ["Enter a comment using 2 to 1,000 characters."] });
        var reportId = await db.Reports.AsNoTracking().Where(item => item.ReferenceNo == NormaliseReference(reference))
            .Select(item => (Guid?)item.Id).SingleOrDefaultAsync();
        if (reportId is null) return Results.NotFound(new { message = "Report not found." });
        var comment = new ReportComment
        {
            Id = Guid.NewGuid(), ReportId = reportId.Value, AuthorId = actorId,
            Body = body, CreatedAt = DateTimeOffset.UtcNow
        };
        db.Comments.Add(comment);
        await db.SaveChangesAsync();
        return Results.Created($"/api/v1/staff/reports/{NormaliseReference(reference)}/comments/{comment.Id}",
            new StaffCommentResponse(comment.Id, principal.FindFirstValue(ClaimTypes.Name) ?? "Staff",
                principal.FindFirstValue(ClaimTypes.Role) ?? Roles.Staff, comment.Body, comment.CreatedAt));
    }

    private static async Task<IResult> MarkDuplicate(string reference, DuplicateRequest request,
        ClaimsPrincipal principal, AppDbContext db)
    {
        if (!TryGetUserId(principal, out var actorId)) return Results.Unauthorized();
        var note = request.Note?.Trim();
        if (note?.Length > 500)
            return Results.ValidationProblem(new Dictionary<string, string[]> { ["note"] = ["Duplicate notes must be 500 characters or fewer."] });
        var reportReference = NormaliseReference(reference);
        var duplicateReference = NormaliseReference(request.PotentialDuplicateReference ?? "");
        var ids = await db.Reports.AsNoTracking()
            .Where(item => item.ReferenceNo == reportReference || item.ReferenceNo == duplicateReference)
            .Select(item => new { item.Id, item.ReferenceNo }).ToListAsync();
        var report = ids.SingleOrDefault(item => item.ReferenceNo == reportReference);
        var duplicate = ids.SingleOrDefault(item => item.ReferenceNo == duplicateReference);
        if (report is null) return Results.NotFound(new { message = "Report not found." });
        if (duplicate is null || duplicate.Id == report.Id)
            return Results.ValidationProblem(new Dictionary<string, string[]> { ["potentialDuplicateReference"] = ["Enter a different valid report reference."] });
        if (await db.DuplicateReviews.AnyAsync(item => item.ReportId == report.Id && item.PotentialDuplicateReportId == duplicate.Id))
            return Results.Conflict(new { message = "This potential duplicate is already recorded." });
        var review = new DuplicateReview
        {
            Id = Guid.NewGuid(), ReportId = report.Id, PotentialDuplicateReportId = duplicate.Id,
            MarkedByUserId = actorId, Note = string.IsNullOrWhiteSpace(note) ? null : note,
            CreatedAt = DateTimeOffset.UtcNow
        };
        db.DuplicateReviews.Add(review);
        await db.SaveChangesAsync();
        return Results.Created($"/api/v1/staff/reports/{reportReference}",
            new DuplicateResponse(review.Id, duplicate.ReferenceNo,
                principal.FindFirstValue(ClaimTypes.Name) ?? "Staff", review.Note, review.CreatedAt));
    }

    private static IQueryable<StaffReportSummaryResponse> StaffSummaryQuery(AppDbContext db,
        IQueryable<CommunityReport>? source = null) => (source ?? db.Reports.AsNoTracking())
        .Select(report => new StaffReportSummaryResponse(report.ReferenceNo, report.Category.Name,
            report.Location, report.Priority, report.CurrentStatus.Code, report.CurrentStatus.Name,
            db.Assignments.Where(item => item.ReportId == report.Id).OrderByDescending(item => item.AssignedAt)
                .Select(item => item.AssignedToUser.Name).FirstOrDefault(), report.SubmittedAt));

    private static string NormaliseReference(string reference) => reference.Trim().ToUpperInvariant();
    private static bool TryGetUserId(ClaimsPrincipal principal, out Guid userId) =>
        Guid.TryParse(principal.FindFirstValue(ClaimTypes.NameIdentifier), out userId);
}

public record StaffCountResponse(string Code, string Name, int Count);
public record StaffDashboardResponse(int TotalReports, int UnassignedReports, int UrgentReports,
    IReadOnlyList<StaffCountResponse> StatusCounts, IReadOnlyList<StaffCountResponse> PriorityCounts,
    IReadOnlyList<StaffReportSummaryResponse> RecentReports);
public record StaffUserResponse(Guid Id, string Name, string Email, string Role);
public record StaffReportSummaryResponse(string Reference, string Category, string Location, string Priority,
    string StatusCode, string Status, string? AssignedToName, DateTimeOffset SubmittedAt);
public record StaffReportCore(Guid Id, string Reference, string ResidentName, string ResidentEmail,
    string Category, string Description, string Location, decimal? Latitude, decimal? Longitude,
    string Priority, string StatusCode, string Status, DateTimeOffset SubmittedAt);
public record StaffHistoryResponse(string StatusCode, string Status, string ChangedByName, string? Note,
    DateTimeOffset ChangedAt);
public record AssignmentResponse(Guid Id, Guid AssignedToUserId, string AssignedToName, string AssignedByName,
    DateTimeOffset AssignedAt);
public record StaffCommentResponse(Guid Id, string AuthorName, string AuthorRole, string Body,
    DateTimeOffset CreatedAt);
public record DuplicateResponse(Guid Id, string PotentialDuplicateReference, string MarkedByName, string? Note,
    DateTimeOffset CreatedAt);
public record StaffReportDetailResponse(string Reference, string ResidentName, string ResidentEmail,
    string Category, string Description, string Location, decimal? Latitude, decimal? Longitude,
    string Priority, string StatusCode, string Status, DateTimeOffset SubmittedAt,
    AssignmentResponse? CurrentAssignment, IReadOnlyList<AssignmentResponse> Assignments,
    IReadOnlyList<StaffHistoryResponse> History, IReadOnlyList<StaffCommentResponse> Comments,
    IReadOnlyList<DuplicateResponse> Duplicates);
public record PriorityRequest(string? Priority);
public record AssignmentRequest(Guid AssignedToUserId);
public record StatusUpdateRequest(string? StatusCode, string? Note);
public record StaffCommentRequest(string? Body);
public record DuplicateRequest(string? PotentialDuplicateReference, string? Note);
