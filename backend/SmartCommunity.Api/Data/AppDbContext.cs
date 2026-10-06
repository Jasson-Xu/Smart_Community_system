using Microsoft.EntityFrameworkCore;
using SmartCommunity.Api.Models;

namespace SmartCommunity.Api.Data;

public sealed class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<AppUser> Users => Set<AppUser>();

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
    }
}
