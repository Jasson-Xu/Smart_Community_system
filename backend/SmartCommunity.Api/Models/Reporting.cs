namespace SmartCommunity.Api.Models;

public sealed class IssueCategory
{
    public Guid Id { get; set; }
    public string Slug { get; set; } = "";
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;
}

public sealed class ReportStatus
{
    public Guid Id { get; set; }
    public string Code { get; set; } = "";
    public string Name { get; set; } = "";
    public int SortOrder { get; set; }
}

public sealed class CommunityReport
{
    public Guid Id { get; set; }
    public string ReferenceNo { get; set; } = "";
    public Guid ResidentId { get; set; }
    public AppUser Resident { get; set; } = null!;
    public Guid CategoryId { get; set; }
    public IssueCategory Category { get; set; } = null!;
    public Guid CurrentStatusId { get; set; }
    public ReportStatus CurrentStatus { get; set; } = null!;
    public string Description { get; set; } = "";
    public string Location { get; set; } = "";
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public string? GooglePlaceId { get; set; }
    public DateTimeOffset SubmittedAt { get; set; }
}

public sealed class StatusHistoryEntry
{
    public Guid Id { get; set; }
    public Guid ReportId { get; set; }
    public CommunityReport Report { get; set; } = null!;
    public Guid StatusId { get; set; }
    public ReportStatus Status { get; set; } = null!;
    public Guid ChangedByUserId { get; set; }
    public AppUser ChangedByUser { get; set; } = null!;
    public string? Note { get; set; }
    public DateTimeOffset ChangedAt { get; set; }
}
