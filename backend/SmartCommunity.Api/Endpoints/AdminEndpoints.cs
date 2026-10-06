using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using SmartCommunity.Api.Data;
using SmartCommunity.Api.Models;

namespace SmartCommunity.Api.Endpoints;

public static partial class AdminEndpoints
{
    private static readonly IReadOnlyDictionary<string, string> AllowedSettings = new Dictionary<string, string>
    {
        ["service.display_name"] = "Public service name shown to users",
        ["service.contact_email"] = "Public support contact email",
        ["reports.public_notice"] = "Non-sensitive notice shown alongside report services"
    };

    public static IEndpointRouteBuilder MapAdminEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var admin = endpoints.MapGroup("/api/v1/admin")
            .RequireAuthorization(policy => policy.RequireRole(Roles.Administrator));
        admin.MapGet("/dashboard", GetDashboard);
        admin.MapGet("/roles", GetRoles);
        admin.MapGet("/users", ListUsers);
        admin.MapPatch("/users/{id:guid}/status", UpdateUserStatus);
        admin.MapPut("/users/{id:guid}/roles", UpdateUserRoles);
        admin.MapGet("/categories", ListCategories);
        admin.MapPost("/categories", CreateCategory);
        admin.MapPatch("/categories/{id:guid}", UpdateCategory);
        admin.MapGet("/settings", ListSettings);
        admin.MapPut("/settings/{key}", UpdateSetting);
        admin.MapGet("/audit-logs", ListAuditLogs);
        return endpoints;
    }

    private static async Task<IResult> GetDashboard(AppDbContext db)
    {
        var totalUsers = await db.Users.CountAsync();
        var activeUsers = await db.Users.CountAsync(user => user.IsActive);
        var activeCategories = await db.Categories.CountAsync(category => category.IsActive);
        var auditCount = await db.AuditLogs.CountAsync();
        var roleCounts = await db.Roles.AsNoTracking().OrderBy(role => role.Name)
            .Select(role => new AdminCountResponse(role.Name,
                db.UserRoles.Count(item => item.RoleId == role.Id && item.User.IsActive))).ToListAsync();
        var recentAuditSource = db.AuditLogs.AsNoTracking().OrderByDescending(log => log.CreatedAt).Take(8);
        var recentAudits = await AuditQuery(recentAuditSource).ToListAsync();
        return Results.Ok(new AdminDashboardResponse(totalUsers, activeUsers, totalUsers - activeUsers,
            activeCategories, auditCount, roleCounts, recentAudits));
    }

    private static async Task<IResult> GetRoles(AppDbContext db) => Results.Ok(await db.Roles.AsNoTracking()
        .OrderBy(role => role.Name).Select(role => new RoleResponse(role.Name, role.Description)).ToListAsync());

    private static async Task<IResult> ListUsers(string? q, string? role, bool? active, AppDbContext db)
    {
        var query = db.Users.AsNoTracking().AsQueryable();
        var search = q?.Trim();
        if (search?.Length > 100)
            return Results.ValidationProblem(new Dictionary<string, string[]> { ["q"] = ["Search text must be 100 characters or fewer."] });
        if (!string.IsNullOrWhiteSpace(search))
        {
            var lowerSearch = search.ToLower();
            query = query.Where(user => user.Name.ToLower().Contains(lowerSearch) || user.Email.ToLower().Contains(lowerSearch));
        }
        if (!string.IsNullOrWhiteSpace(role))
        {
            var roleName = role.Trim();
            if (!await db.Roles.AnyAsync(item => item.Name == roleName))
                return Results.ValidationProblem(new Dictionary<string, string[]> { ["role"] = ["Select a valid role."] });
            query = query.Where(user => user.UserRoles.Any(item => item.Role.Name == roleName));
        }
        if (active.HasValue) query = query.Where(user => user.IsActive == active.Value);
        return Results.Ok(await query.OrderBy(user => user.Name)
            .Select(user => new AdminUserResponse(user.Id, user.Name, user.Email, user.IsActive,
                user.UserRoles.OrderBy(item => item.Role.Name).Select(item => item.Role.Name).ToList(), user.CreatedAt))
            .ToListAsync());
    }

    private static async Task<IResult> UpdateUserStatus(Guid id, UserStatusRequest request,
        ClaimsPrincipal principal, AppDbContext db)
    {
        if (!TryGetActorId(principal, out var actorId)) return Results.Unauthorized();
        var user = await db.Users.Include(item => item.UserRoles).ThenInclude(item => item.Role)
            .SingleOrDefaultAsync(item => item.Id == id);
        if (user is null) return Results.NotFound(new { message = "User not found." });
        if (actorId == id && !request.IsActive)
            return Results.ValidationProblem(new Dictionary<string, string[]> { ["isActive"] = ["You cannot deactivate your own account."] });
        if (!request.IsActive && user.UserRoles.Any(item => item.Role.Name == Roles.Administrator) &&
            await ActiveAdministratorCount(db) <= 1)
            return Results.ValidationProblem(new Dictionary<string, string[]> { ["isActive"] = ["At least one active administrator must remain."] });
        var previous = user.IsActive;
        user.IsActive = request.IsActive;
        AddAudit(db, actorId, request.IsActive ? "user.activated" : "user.deactivated", "user", user.Id.ToString(),
            new { previous, current = request.IsActive, user.Email });
        await db.SaveChangesAsync();
        return Results.Ok(new { user.Id, user.IsActive });
    }

    private static async Task<IResult> UpdateUserRoles(Guid id, UserRolesRequest request,
        ClaimsPrincipal principal, AppDbContext db)
    {
        if (!TryGetActorId(principal, out var actorId)) return Results.Unauthorized();
        var requestedNames = (request.Roles ?? []).Select(role => role.Trim()).Where(role => role.Length > 0)
            .Distinct(StringComparer.Ordinal).OrderBy(role => role).ToArray();
        if (requestedNames.Length == 0)
            return Results.ValidationProblem(new Dictionary<string, string[]> { ["roles"] = ["Select at least one role."] });
        var roles = await db.Roles.Where(role => requestedNames.Contains(role.Name)).ToListAsync();
        if (roles.Count != requestedNames.Length)
            return Results.ValidationProblem(new Dictionary<string, string[]> { ["roles"] = ["One or more roles are invalid."] });
        var user = await db.Users.Include(item => item.UserRoles).ThenInclude(item => item.Role)
            .SingleOrDefaultAsync(item => item.Id == id);
        if (user is null) return Results.NotFound(new { message = "User not found." });
        var previousRoles = user.UserRoles.Select(item => item.Role.Name).OrderBy(role => role).ToArray();
        var removesAdministrator = previousRoles.Contains(Roles.Administrator) && !requestedNames.Contains(Roles.Administrator);
        if (actorId == id && removesAdministrator)
            return Results.ValidationProblem(new Dictionary<string, string[]> { ["roles"] = ["You cannot remove your own Administrator role."] });
        if (user.IsActive && removesAdministrator && await ActiveAdministratorCount(db) <= 1)
            return Results.ValidationProblem(new Dictionary<string, string[]> { ["roles"] = ["At least one active administrator must remain."] });
        db.UserRoles.RemoveRange(user.UserRoles);
        foreach (var role in roles) db.UserRoles.Add(new UserRole { UserId = user.Id, RoleId = role.Id });
        AddAudit(db, actorId, "user.roles_updated", "user", user.Id.ToString(),
            new { previousRoles, currentRoles = requestedNames, user.Email });
        await db.SaveChangesAsync();
        return Results.Ok(new { user.Id, roles = requestedNames });
    }

    private static async Task<IResult> ListCategories(AppDbContext db) => Results.Ok(await db.Categories.AsNoTracking()
        .OrderBy(category => category.SortOrder).ThenBy(category => category.Name)
        .Select(category => new AdminCategoryResponse(category.Id, category.Slug, category.Name,
            category.Description, category.SortOrder, category.IsActive,
            db.Reports.Count(report => report.CategoryId == category.Id))).ToListAsync());

    private static async Task<IResult> CreateCategory(CategoryCreateRequest request,
        ClaimsPrincipal principal, AppDbContext db)
    {
        if (!TryGetActorId(principal, out var actorId)) return Results.Unauthorized();
        var validation = ValidateCategory(request.Slug, request.Name, request.Description, request.SortOrder);
        if (validation is not null) return Results.ValidationProblem(validation);
        var slug = request.Slug!.Trim().ToLowerInvariant();
        var name = request.Name!.Trim();
        if (await db.Categories.AnyAsync(category => category.Slug == slug || category.Name == name))
            return Results.Conflict(new { message = "A category with this slug or name already exists." });
        var category = new IssueCategory
        {
            Id = Guid.NewGuid(), Slug = slug, Name = name, Description = request.Description!.Trim(),
            SortOrder = request.SortOrder, IsActive = request.IsActive
        };
        db.Categories.Add(category);
        AddAudit(db, actorId, "category.created", "category", category.Id.ToString(),
            new { category.Slug, category.Name, category.SortOrder, category.IsActive });
        await db.SaveChangesAsync();
        return Results.Created($"/api/v1/admin/categories/{category.Id}", new AdminCategoryResponse(category.Id,
            category.Slug, category.Name, category.Description, category.SortOrder, category.IsActive, 0));
    }

    private static async Task<IResult> UpdateCategory(Guid id, CategoryUpdateRequest request,
        ClaimsPrincipal principal, AppDbContext db)
    {
        if (!TryGetActorId(principal, out var actorId)) return Results.Unauthorized();
        var category = await db.Categories.SingleOrDefaultAsync(item => item.Id == id);
        if (category is null) return Results.NotFound(new { message = "Category not found." });
        var name = request.Name?.Trim() ?? category.Name;
        var description = request.Description?.Trim() ?? category.Description;
        var sortOrder = request.SortOrder ?? category.SortOrder;
        var validation = ValidateCategory(category.Slug, name, description, sortOrder);
        if (validation is not null) return Results.ValidationProblem(validation);
        if (await db.Categories.AnyAsync(item => item.Id != id && item.Name == name))
            return Results.Conflict(new { message = "A category with this name already exists." });
        var previous = new { category.Name, category.Description, category.SortOrder, category.IsActive };
        category.Name = name; category.Description = description; category.SortOrder = sortOrder;
        if (request.IsActive.HasValue) category.IsActive = request.IsActive.Value;
        AddAudit(db, actorId, "category.updated", "category", category.Id.ToString(),
            new { previous, current = new { category.Name, category.Description, category.SortOrder, category.IsActive } });
        await db.SaveChangesAsync();
        var reportCount = await db.Reports.CountAsync(report => report.CategoryId == category.Id);
        return Results.Ok(new AdminCategoryResponse(category.Id, category.Slug, category.Name,
            category.Description, category.SortOrder, category.IsActive, reportCount));
    }

    private static async Task<IResult> ListSettings(AppDbContext db)
    {
        var stored = await db.SystemSettings.AsNoTracking().ToDictionaryAsync(setting => setting.Key);
        return Results.Ok(AllowedSettings.Select(item => stored.TryGetValue(item.Key, out var setting)
            ? new SettingResponse(setting.Key, setting.Value, setting.Description, setting.Version, setting.UpdatedAt)
            : new SettingResponse(item.Key, "", item.Value, 0, null)).ToList());
    }

    private static async Task<IResult> UpdateSetting(string key, SettingUpdateRequest request,
        ClaimsPrincipal principal, AppDbContext db)
    {
        if (!TryGetActorId(principal, out var actorId)) return Results.Unauthorized();
        var normalisedKey = key.Trim().ToLowerInvariant();
        if (!AllowedSettings.TryGetValue(normalisedKey, out var description))
            return Results.ValidationProblem(new Dictionary<string, string[]> { ["key"] = ["This setting is not approved for administration."] });
        var value = request.Value?.Trim() ?? "";
        if (value.Length > 1000 || (normalisedKey == "service.display_name" && value.Length > 100) ||
            (normalisedKey == "service.contact_email" && value.Length > 0 && !new EmailAddressAttribute().IsValid(value)))
            return Results.ValidationProblem(new Dictionary<string, string[]> { ["value"] = ["Enter a valid value for this setting."] });
        var setting = await db.SystemSettings.SingleOrDefaultAsync(item => item.Key == normalisedKey);
        var previousValue = setting?.Value;
        if (setting is null)
        {
            setting = new SystemSetting { Id = Guid.NewGuid(), Key = normalisedKey, Description = description, Version = 1 };
            db.SystemSettings.Add(setting);
        }
        else setting.Version++;
        setting.Value = value; setting.UpdatedByUserId = actorId; setting.UpdatedAt = DateTimeOffset.UtcNow;
        AddAudit(db, actorId, "setting.updated", "system_setting", normalisedKey,
            new { previousValue, currentValue = value, setting.Version });
        await db.SaveChangesAsync();
        return Results.Ok(new SettingResponse(setting.Key, setting.Value, setting.Description, setting.Version, setting.UpdatedAt));
    }

    private static async Task<IResult> ListAuditLogs(string? action, string? entityType, AppDbContext db)
    {
        var query = db.AuditLogs.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(action)) query = query.Where(log => log.Action == action.Trim());
        if (!string.IsNullOrWhiteSpace(entityType)) query = query.Where(log => log.EntityType == entityType.Trim());
        return Results.Ok(await AuditQuery(query.OrderByDescending(log => log.CreatedAt).Take(100)).ToListAsync());
    }

    private static IQueryable<AuditResponse> AuditQuery(IQueryable<AuditLog> source) => source
        .Select(log => new AuditResponse(log.Id, log.ActorUser != null ? log.ActorUser.Name : "System",
            log.Action, log.EntityType, log.EntityId, log.Details, log.CreatedAt));

    private static Dictionary<string, string[]>? ValidateCategory(string? slugValue, string? nameValue,
        string? descriptionValue, int sortOrder)
    {
        var slug = slugValue?.Trim().ToLowerInvariant() ?? "";
        var name = nameValue?.Trim() ?? "";
        var description = descriptionValue?.Trim() ?? "";
        var errors = new Dictionary<string, string[]>();
        if (slug.Length is < 2 or > 80 || !SlugPattern().IsMatch(slug)) errors["slug"] = ["Use 2 to 80 lower-case letters, numbers, and single hyphens."];
        if (name.Length is < 2 or > 100) errors["name"] = ["Use a category name between 2 and 100 characters."];
        if (description.Length is < 2 or > 240) errors["description"] = ["Use a description between 2 and 240 characters."];
        if (sortOrder is < 0 or > 10000) errors["sortOrder"] = ["Sort order must be between 0 and 10,000."];
        return errors.Count == 0 ? null : errors;
    }

    private static async Task<int> ActiveAdministratorCount(AppDbContext db) => await db.Users.CountAsync(user =>
        user.IsActive && user.UserRoles.Any(item => item.Role.Name == Roles.Administrator));

    private static void AddAudit(AppDbContext db, Guid actorId, string action, string entityType,
        string entityId, object details)
    {
        var json = JsonSerializer.Serialize(details);
        db.AuditLogs.Add(new AuditLog
        {
            Id = Guid.NewGuid(), ActorUserId = actorId, Action = action, EntityType = entityType,
            EntityId = entityId, Details = json.Length <= 2000 ? json : json[..2000], CreatedAt = DateTimeOffset.UtcNow
        });
    }

    private static bool TryGetActorId(ClaimsPrincipal principal, out Guid actorId) =>
        Guid.TryParse(principal.FindFirstValue(ClaimTypes.NameIdentifier), out actorId);

    [GeneratedRegex("^[a-z0-9]+(?:-[a-z0-9]+)*$")]
    private static partial Regex SlugPattern();
}

public record AdminCountResponse(string Name, int Count);
public record AdminDashboardResponse(int TotalUsers, int ActiveUsers, int InactiveUsers, int ActiveCategories,
    int AuditCount, IReadOnlyList<AdminCountResponse> RoleCounts, IReadOnlyList<AuditResponse> RecentAudits);
public record RoleResponse(string Name, string Description);
public record AdminUserResponse(Guid Id, string Name, string Email, bool IsActive,
    IReadOnlyList<string> Roles, DateTimeOffset CreatedAt);
public record UserStatusRequest(bool IsActive);
public record UserRolesRequest(IReadOnlyList<string>? Roles);
public record AdminCategoryResponse(Guid Id, string Slug, string Name, string Description,
    int SortOrder, bool IsActive, int ReportCount);
public record CategoryCreateRequest(string? Slug, string? Name, string? Description, int SortOrder, bool IsActive = true);
public record CategoryUpdateRequest(string? Name, string? Description, int? SortOrder, bool? IsActive);
public record SettingResponse(string Key, string Value, string Description, int Version, DateTimeOffset? UpdatedAt);
public record SettingUpdateRequest(string? Value);
public record AuditResponse(Guid Id, string ActorName, string Action, string EntityType,
    string EntityId, string Details, DateTimeOffset CreatedAt);
