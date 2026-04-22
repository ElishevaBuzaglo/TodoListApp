using Microsoft.EntityFrameworkCore;
using TodoApi.Models;
using TodoApi.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);

// 1. הגדרת אימות (Authentication) עם JWT
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

// 2. הגדרת שירותים (Services) - עם תיקון ל-JSON (camelCase)
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // התיקון: שימוש ב-CamelCase כדי שיתאים לסטנדרט של JavaScript (id, name וכו')
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// 3. הגדרת CORS Policy
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// 4. התחברות למסד הנתונים (MySQL ב-Clever Cloud)
var connectionString = builder.Configuration.GetConnectionString("ToDoDB");
var serverVersion = new MySqlServerVersion(new Version(8, 0, 45));

builder.Services.AddDbContext<ToDoDbContext>(options =>
    options.UseMySql(connectionString, serverVersion, mysqlOptions => 
        mysqlOptions.EnableRetryOnFailure(
            maxRetryCount: 10,           // ינסה 10 פעמים לפני שיתייאש
            maxRetryDelay: TimeSpan.FromSeconds(5), // יחכה 5 שניות בין ניסיון לניסיון
            errorNumbersToAdd: null)
    ));

// 5. רישום ה-Services
builder.Services.AddScoped<ItemService>();
builder.Services.AddScoped<AuthService>();

var app = builder.Build();

// --- 6. הגדרת Middleware ---

// פתרון ידני ל-CORS ו-Preflight (OPTIONS)
app.Use((context, next) =>
{
    context.Response.Headers.Append("Access-Control-Allow-Origin", "*");
    context.Response.Headers.Append("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    context.Response.Headers.Append("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (context.Request.Method == "OPTIONS")
    {
        context.Response.StatusCode = 200;
        return Task.CompletedTask;
    }
    return next();
});

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthentication(); // חייב לבוא לפני Authorization
app.UseAuthorization();

app.MapControllers();

app.Run();