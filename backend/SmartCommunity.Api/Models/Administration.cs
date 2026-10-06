namespace SmartCommunity.Api.Models;

public sealed class SystemSetting
{
    public Guid Id { get; set; }
    public string Key { get; set; } = "";
    public string Value { get; set; } = "";
    public string Description { get; set; } = "";
    public int Version { get; set; } = 1;
    public Guid? UpdatedByUserId { get; set; }
    public AppUser? UpdatedByUser { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}

public sealed class AuditLog
{
    public Guid Id { get; set; }
    public Guid? ActorUserId { get; set; }
    public AppUser? ActorUser { get; set; }
    public string Action { get; set; } = "";
    public string EntityType { get; set; } = "";
    public string EntityId { get; set; } = "";
    public string Details { get; set; } = "";
    public DateTimeOffset CreatedAt { get; set; }
}
