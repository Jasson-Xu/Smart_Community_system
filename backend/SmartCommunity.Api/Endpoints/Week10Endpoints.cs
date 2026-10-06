using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using SmartCommunity.Api.Data;
using SmartCommunity.Api.Models;

namespace SmartCommunity.Api.Endpoints;

public static class Week10Endpoints
{
    public static IEndpointRouteBuilder MapWeek10Endpoints(this IEndpointRouteBuilder endpoints)
    {
        var resident = endpoints.MapGroup("/api/v1/resident")
            .RequireAuthorization(policy => policy.RequireRole(Roles.Resident));
        resident.MapGet("/notifications", ListNotifications);
        resident.MapPatch("/notifications/{id:guid}/read", MarkRead);
        var reports = endpoints.MapGroup("/api/v1/reports")
            .RequireAuthorization(policy => policy.RequireRole(Roles.Resident));
        reports.MapGet("/{reference}/feedback", GetFeedback);
        reports.MapPost("/{reference}/feedback", SubmitFeedback);
        return endpoints;
    }

    private static async Task<IResult> ListNotifications(ClaimsPrincipal principal, AppDbContext db)
    {
        if (!TryGetUserId(principal, out var residentId)) return Results.Unauthorized();
        var items = await db.Notifications.AsNoTracking().Where(item => item.RecipientId == residentId)
            .OrderByDescending(item => item.CreatedAt).Take(50)
            .Select(item => new NotificationResponse(item.Id, item.Report.ReferenceNo, item.StatusCode,
                item.StatusHistory.Status.Name, item.CreatedAt, item.ReadAt)).ToListAsync();
        return Results.Ok(items);
    }

    private static async Task<IResult> MarkRead(Guid id, ClaimsPrincipal principal, AppDbContext db)
    {
        if (!TryGetUserId(principal, out var residentId)) return Results.Unauthorized();
        var item = await db.Notifications.SingleOrDefaultAsync(notification => notification.Id == id && notification.RecipientId == residentId);
        if (item is null) return Results.NotFound(new { message = "Notification not found." });
        if (item.ReadAt is null)
        {
            item.ReadAt = DateTimeOffset.UtcNow;
            await db.SaveChangesAsync();
        }
        return Results.Ok(new { item.Id, item.ReadAt });
    }

    private static async Task<IResult> GetFeedback(string reference, ClaimsPrincipal principal, AppDbContext db)
    {
        if (!TryGetUserId(principal, out var residentId)) return Results.Unauthorized();
        var report = await db.Reports.AsNoTracking()
            .Where(item => item.ResidentId == residentId && item.ReferenceNo == reference.Trim().ToUpperInvariant())
            .Select(item => new { item.Id, StatusCode = item.CurrentStatus.Code }).SingleOrDefaultAsync();
        if (report is null) return Results.NotFound(new { message = "Report not found." });
        var feedback = await db.Feedback.AsNoTracking().Where(item => item.ReportId == report.Id)
            .Select(item => new FeedbackResponse(item.Rating, item.Comment, item.SubmittedAt)).SingleOrDefaultAsync();
        return Results.Ok(new FeedbackStateResponse(report.StatusCode is "RESOLVED" or "CLOSED", feedback));
    }

    private static async Task<IResult> SubmitFeedback(string reference, FeedbackRequest request,
        ClaimsPrincipal principal, AppDbContext db)
    {
        if (!TryGetUserId(principal, out var residentId)) return Results.Unauthorized();
        if (request.Rating is < 1 or > 5)
            return Results.ValidationProblem(new Dictionary<string, string[]> { ["rating"] = ["Select a rating from 1 to 5."] });
        var comment = request.Comment?.Trim();
        if (comment?.Length > 1000)
            return Results.ValidationProblem(new Dictionary<string, string[]> { ["comment"] = ["Feedback must be 1,000 characters or fewer."] });
        var report = await db.Reports.AsNoTracking()
            .Where(item => item.ResidentId == residentId && item.ReferenceNo == reference.Trim().ToUpperInvariant())
            .Select(item => new { item.Id, StatusCode = item.CurrentStatus.Code }).SingleOrDefaultAsync();
        if (report is null) return Results.NotFound(new { message = "Report not found." });
        if (report.StatusCode is not ("RESOLVED" or "CLOSED"))
            return Results.Conflict(new { message = "Feedback is available after this report is resolved." });
        if (await db.Feedback.AnyAsync(item => item.ReportId == report.Id))
            return Results.Conflict(new { message = "Feedback has already been submitted for this report." });
        var feedback = new ReportFeedback
        {
            Id = Guid.NewGuid(), ReportId = report.Id, ResidentId = residentId,
            Rating = request.Rating, Comment = string.IsNullOrWhiteSpace(comment) ? null : comment,
            SubmittedAt = DateTimeOffset.UtcNow
        };
        db.Feedback.Add(feedback);
        try { await db.SaveChangesAsync(); }
        catch (DbUpdateException exception) when (exception.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation })
        {
            return Results.Conflict(new { message = "Feedback has already been submitted for this report." });
        }
        return Results.Created($"/api/v1/reports/{reference.Trim().ToUpperInvariant()}/feedback",
            new FeedbackResponse(feedback.Rating, feedback.Comment, feedback.SubmittedAt));
    }

    private static bool TryGetUserId(ClaimsPrincipal principal, out Guid userId) =>
        Guid.TryParse(principal.FindFirstValue(ClaimTypes.NameIdentifier), out userId);
}

public record NotificationResponse(Guid Id, string Reference, string StatusCode, string Status,
    DateTimeOffset CreatedAt, DateTimeOffset? ReadAt);
public record FeedbackRequest(int Rating, string? Comment);
public record FeedbackResponse(int Rating, string? Comment, DateTimeOffset SubmittedAt);
public record FeedbackStateResponse(bool Eligible, FeedbackResponse? Feedback);
