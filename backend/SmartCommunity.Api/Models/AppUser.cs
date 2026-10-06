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
    public string Role { get; set; } = Roles.Resident;
    public DateTimeOffset CreatedAt { get; set; }
}
