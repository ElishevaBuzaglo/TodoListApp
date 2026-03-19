using Microsoft.EntityFrameworkCore;
using TodoApi.Models;
using TodoApi.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// 1. הגדרת אימות (Authentication) עם JWT - חייב להיות לפני Build
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]))
        };
    });

// 2. הגדרת שירותים (Services)
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// 3. הגדרת CORS - פוליסי שמאפשר הכל כדי למנוע חסימות דפדפן
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// 4. הגדרת MySQL
var connectionString = builder.Configuration.GetConnectionString("ToDoDB");
var serverVersion = new MySqlServerVersion(new Version(8, 0, 45));

builder.Services.AddDbContext<ToDoDbContext>(options =>
    options.UseMySql(connectionString, serverVersion));

// 5. רישום ה-Services ב-Dependency Injection
builder.Services.AddScoped<ItemService>();
builder.Services.AddScoped<AuthService>();

// --- כאן נבנית האפליקציה ---
var app = builder.Build();

// 6. הגדרת Middleware (סדר הפעולות קריטי!)

// תמיד להציג Swagger ב-Render כדי שנוכל לבדוק שהשרת עובד
app.UseSwagger();
app.UseSwaggerUI(options =>
{
    options.SwaggerEndpoint("/swagger/v1/swagger.json", "v1");
    options.RoutePrefix = string.Empty; // הופך את ה-Swagger לדף הבית
});

// ה-CORS חייב לבוא לפני Authentication ו-Authorization
app.UseCors("AllowAll");

app.UseAuthentication();
app.UseAuthorization();

// מיפוי הקונטרולרים
app.MapControllers();

app.Run();