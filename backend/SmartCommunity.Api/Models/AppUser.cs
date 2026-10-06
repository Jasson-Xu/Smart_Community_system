namespace SmartCommunity.Api.Models;

public static class Roles
{
    public const string Resident = "Resident";
    public const string Staff = "Staff";
    public const string Administrator = "Administrator";
}

public sealed class AppUser
{
    public Guid Id { get; set; }
    public string Name { get; set; } = "";
    public string Email { get; set; } = "";
    public string PasswordHash { get; set; } = "";
    public bool IsActive { get; set; } = true;
    public DateTimeOffset CreatedAt { get; set; }
    public ICollection<UserRole> UserRoles { get; set; } = [];
}

public sealed class Role
{
    public Guid Id { get; set; }
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
}

public sealed class UserRole
{
    public Guid UserId { get; set; }
    public AppUser User { get; set; } = null!;
    public Guid RoleId { get; set; }
    public Role Role { get; set; } = null!;
}
