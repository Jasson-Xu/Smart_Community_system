using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using SmartCommunity.Api.Data;
using SmartCommunity.Api.Models;

var builder = WebApplication.CreateBuilder(args);
builder.Logging.ClearProviders();
builder.Logging.AddConsole();
if (builder.Environment.IsDevelopment())
{
    var keyPath = Path.GetFullPath(Path.Combine(builder.Environment.ContentRootPath,
        "..", "..", ".docker-data", "data-protection-keys"));
    Directory.CreateDirectory(keyPath);
    builder.Services.AddDataProtection().PersistKeysToFileSystem(new DirectoryInfo(keyPath));
}
var connectionString = builder.Configuration.GetConnectionString("Default")
    ?? throw new InvalidOperationException("ConnectionStrings:Default must be configured.");
var frontendOrigin = builder.Configuration["Frontend:Origin"]
    ?? throw new InvalidOperationException("Frontend:Origin must be configured.");

builder.Services.AddDbContext<AppDbContext>(options => options.UseNpgsql(connectionString));
builder.Services.AddScoped<IPasswordHasher<AppUser>, PasswordHasher<AppUser>>();
builder.Services.AddCors(options => options.AddPolicy("Frontend", policy =>
    policy.WithOrigins(frontendOrigin).AllowAnyHeader().AllowAnyMethod().AllowCredentials()));
builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.Cookie.Name = "smartcommunity.session";
        options.Cookie.HttpOnly = true;
        options.Cookie.SameSite = SameSiteMode.Lax;
        options.Cookie.SecurePolicy = builder.Environment.IsDevelopment()
            ? CookieSecurePolicy.SameAsRequest : CookieSecurePolicy.Always;
        options.ExpireTimeSpan = TimeSpan.FromHours(8);
        options.SlidingExpiration = true;
        options.Events.OnRedirectToLogin = context =>
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return Task.CompletedTask;
        };
        options.Events.OnRedirectToAccessDenied = context =>
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            return Task.CompletedTask;
        };
        options.Events.OnValidatePrincipal = async context =>
        {
            if (!Guid.TryParse(context.Principal?.FindFirstValue(ClaimTypes.NameIdentifier), out var id))
            {
                context.RejectPrincipal();
                return;
            }
            var db = context.HttpContext.RequestServices.GetRequiredService<AppDbContext>();
            var current = await db.Users.AsNoTracking().SingleOrDefaultAsync(user => user.Id == id);
            if (current is null || current.Role != context.Principal?.FindFirstValue(ClaimTypes.Role))
                context.RejectPrincipal();
        };
    });
builder.Services.AddAuthorization();
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy("identity", context => RateLimitPartition.GetFixedWindowLimiter(
        context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 10,
            Window = TimeSpan.FromMinutes(1),
            QueueLimit = 0
        }));
});

var app = builder.Build();
if (!app.Environment.IsDevelopment()) app.UseHttpsRedirection();
app.UseRouting();
app.UseCors("Frontend");
app.Use(async (context, next) =>
{
    if (context.Request.Path.StartsWithSegments("/api") &&
        (HttpMethods.IsPost(context.Request.Method) || HttpMethods.IsPut(context.Request.Method) ||
         HttpMethods.IsPatch(context.Request.Method) || HttpMethods.IsDelete(context.Request.Method)))
    {
        // A custom header prevents ordinary cross-site forms from mutating cookie sessions.
        // CORS permits the header only from the configured frontend origin.
        if (context.Request.Headers["X-Requested-With"] != "XMLHttpRequest" ||
            (context.Request.Headers.Origin.Count > 0 &&
             !string.Equals(context.Request.Headers.Origin, frontendOrigin, StringComparison.OrdinalIgnoreCase)))
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            return;
        }
    }
    await next(context);
});
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

var auth = app.MapGroup("/api/v1/auth");
auth.MapPost("/register", async (RegisterRequest request, AppDbContext db,
    IPasswordHasher<AppUser> passwordHasher, HttpContext http) =>
{
    var name = request.Name?.Trim() ?? "";
    var email = request.Email?.Trim().ToLowerInvariant() ?? "";
    if (name.Length is < 2 or > 100 || !new EmailAddressAttribute().IsValid(email) || email.Length > 254 ||
        !ValidPassword(request.Password))
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
            ["input"] = ["Enter a name (2-100 characters), a valid email, and a password with at least 8 characters including upper-case, lower-case, and a number."]
        });

    if (await db.Users.AnyAsync(user => user.Email == email))
        return Results.Conflict(new { message = "An account with this email already exists." });

    var user = new AppUser { Id = Guid.NewGuid(), Name = name, Email = email,
        Role = Roles.Resident, CreatedAt = DateTimeOffset.UtcNow };
    user.PasswordHash = passwordHasher.HashPassword(user, request.Password!);
    db.Users.Add(user);
    try { await db.SaveChangesAsync(); }
    catch (DbUpdateException exception) when (exception.InnerException is PostgresException { SqlState: "23505" })
    {
        return Results.Conflict(new { message = "An account with this email already exists." });
    }

    await http.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, PrincipalFor(user));
    return Results.Created("/api/v1/auth/me", PublicUser.From(user));
}).RequireRateLimiting("identity");

auth.MapPost("/login", async (LoginRequest request, AppDbContext db,
    IPasswordHasher<AppUser> passwordHasher, HttpContext http) =>
{
    var email = request.Email?.Trim().ToLowerInvariant() ?? "";
    var user = email.Length > 254 ? null : await db.Users.SingleOrDefaultAsync(item => item.Email == email);
    if (user is null || request.Password is null ||
        passwordHasher.VerifyHashedPassword(user, user.PasswordHash, request.Password) == PasswordVerificationResult.Failed)
        return Results.Unauthorized();

    await http.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, PrincipalFor(user));
    return Results.Ok(PublicUser.From(user));
}).RequireRateLimiting("identity");

auth.MapPost("/logout", async (HttpContext http) =>
{
    await http.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
    return Results.NoContent();
});

auth.MapGet("/me", async (HttpContext http, AppDbContext db) =>
{
    if (!Guid.TryParse(http.User.FindFirstValue(ClaimTypes.NameIdentifier), out var id))
        return Results.Unauthorized();
    var user = await db.Users.FindAsync(id);
    return user is null ? Results.Unauthorized() : Results.Ok(PublicUser.From(user));
}).RequireAuthorization();

app.MapGet("/api/v1/staff/me", (ClaimsPrincipal user) => Results.Ok(new { role = user.FindFirstValue(ClaimTypes.Role) }))
    .RequireAuthorization(policy => policy.RequireRole(Roles.Staff, Roles.Administrator));
app.MapGet("/api/v1/admin/me", (ClaimsPrincipal user) => Results.Ok(new { role = user.FindFirstValue(ClaimTypes.Role) }))
    .RequireAuthorization(policy => policy.RequireRole(Roles.Administrator));

if (args.Contains("--bootstrap-role"))
{
    var name = builder.Configuration["Bootstrap:Name"]?.Trim() ?? "";
    var email = builder.Configuration["Bootstrap:Email"]?.Trim().ToLowerInvariant() ?? "";
    var password = builder.Configuration["Bootstrap:Password"];
    var role = builder.Configuration["Bootstrap:Role"];
    if (name.Length is < 2 or > 100 || !new EmailAddressAttribute().IsValid(email) ||
        email.Length > 254 || !ValidPassword(password) || role is not (Roles.Staff or Roles.Administrator))
        throw new InvalidOperationException("Bootstrap requires valid Name, Email, Password and a Staff or Administrator Role.");

    await using var scope = app.Services.CreateAsyncScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    if (await db.Users.AnyAsync(user => user.Email == email))
        throw new InvalidOperationException("Bootstrap account already exists; refusing to change its role or password.");
    var user = new AppUser { Id = Guid.NewGuid(), Name = name, Email = email,
        Role = role, CreatedAt = DateTimeOffset.UtcNow };
    var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher<AppUser>>();
    user.PasswordHash = hasher.HashPassword(user, password!);
    db.Users.Add(user);
    await db.SaveChangesAsync();
    Console.WriteLine($"Created {role} account.");
    return;
}

if (args.Contains("--seed-demo"))
{
    if (!app.Environment.IsDevelopment())
        throw new InvalidOperationException("Demo accounts can only be seeded in Development.");

    await using var scope = app.Services.CreateAsyncScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher<AppUser>>();
    var demoAccounts = new[]
    {
        (Name: "Demo Resident", Email: "resident.demo@example.test", Role: Roles.Resident),
        (Name: "Demo Staff", Email: "staff.demo@example.test", Role: Roles.Staff),
        (Name: "Demo Administrator", Email: "admin.demo@example.test", Role: Roles.Administrator)
    };
    foreach (var demo in demoAccounts)
    {
        var user = await db.Users.SingleOrDefaultAsync(item => item.Email == demo.Email);
        if (user is null)
        {
            user = new AppUser { Id = Guid.NewGuid(), CreatedAt = DateTimeOffset.UtcNow,
                Email = demo.Email };
            db.Users.Add(user);
        }
        user.Name = demo.Name;
        user.Role = demo.Role;
        user.PasswordHash = hasher.HashPassword(user, "DemoPass123!");
    }
    await db.SaveChangesAsync();
    Console.WriteLine("Development demo accounts are ready.");
    return;
}

app.Run();

static bool ValidPassword(string? password) => password is { Length: >= 8 and <= 128 } &&
    password.Any(char.IsUpper) && password.Any(char.IsLower) && password.Any(char.IsDigit);

static ClaimsPrincipal PrincipalFor(AppUser user) => new(new ClaimsIdentity(
    [new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
     new Claim(ClaimTypes.Name, user.Name),
     new Claim(ClaimTypes.Email, user.Email),
     new Claim(ClaimTypes.Role, user.Role)], CookieAuthenticationDefaults.AuthenticationScheme));

public record RegisterRequest(string? Name, string? Email, string? Password);
public record LoginRequest(string? Email, string? Password);
public record PublicUser(Guid Id, string Name, string Email, string Role)
{
    public static PublicUser From(AppUser user) => new(user.Id, user.Name, user.Email, user.Role);
}
