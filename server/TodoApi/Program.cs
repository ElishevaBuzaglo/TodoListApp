using Microsoft.EntityFrameworkCore;
using TodoApi.Models;
using TodoApi.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;


var builder = WebApplication.CreateBuilder(args);

// הגדרת אימות (Authentication) עם JWT
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

// 1. הגדרת קונטרולרים (חיוני לעבודה עם שכבות)
builder.Services.AddControllers();

// 2. הגדרת CORS - מאפשר ל-React (פורט 3000) לדבר עם השרת
builder.Services.AddCors(options =>
{
    options.AddPolicy("MyCustomPolicy", policy =>
    {
        policy.WithOrigins("http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// 3. הגדרת MySQL
var connectionString = builder.Configuration.GetConnectionString("ToDoDB");
var serverVersion = new MySqlServerVersion(new Version(8, 0, 45));

builder.Services.AddDbContext<ToDoDbContext>(options =>
    options.UseMySql(connectionString, serverVersion));

// 4. רישום ה-Service ב-Dependency Injection
builder.Services.AddScoped<ItemService>();
builder.Services.AddScoped<AuthService>(); 
var app = builder.Build();

// 5. הגדרת Middleware
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "v1");
        options.RoutePrefix = string.Empty;
    });
}

app.UseCors("MyCustomPolicy");
//jwt
app.UseAuthentication();
app.UseAuthorization();

// מיפוי הקונטרולרים (במקום ה-MapGet הישנים)
app.MapControllers();

app.Run();