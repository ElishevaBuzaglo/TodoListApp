using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using TodoApi.Models;
using TodoApi.DTOs;
using Microsoft.EntityFrameworkCore;
using BCrypt.Net;

namespace TodoApi.Services
{
    public class AuthService
    {
        private readonly ToDoDbContext _context;
        private readonly IConfiguration _config;

        public AuthService(ToDoDbContext context, IConfiguration config)
        {
            _context = context;
            _config = config;
        }

        // פונקציית כניסה: מחפשת לפי אימייל ומאמתת סיסמה
        public async Task<User?> Authenticate(AuthDto loginData)
        {
            // שליפת משתמש לפי אימייל
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == loginData.Email);
            
            // שימוש ב-BCrypt לוודא שהסיסמה הגלויה תואמת להצפנה ב-DB
            if (user != null && BCrypt.Net.BCrypt.Verify(loginData.Password, user.PasswordHash))
            {
                return user; // אימות הצליח
            }
            return null; // אימות נכשל
        }

        // פונקציית רישום: בודקת כפילות אימייל ומצפינה סיסמה
        public async Task<bool> Register(AuthDto registerData)
        {
            // מניעת כפילות אימיילים
            if (await _context.Users.AnyAsync(u => u.Email == registerData.Email))
                return false;

            var newUser = new User
            {
                Email = registerData.Email,
                Username = registerData.Username ?? registerData.Email.Split('@')[0],
                // הצפנת הסיסמה לפני השמירה - אבטחה קריטית!
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(registerData.Password),
                CreatedAt = DateTime.Now
            };

            _context.Users.Add(newUser);
            await _context.SaveChangesAsync();
            return true;
        }

        // יצירת JWT Token שיישלח ללקוח
        public string GenerateToken(User user)
        {
            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            // הוספת מידע בסיסי לתוך הטוקן
            var claims = new[] {
                new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
                new Claim(ClaimTypes.Name, user.Username),
                new Claim(ClaimTypes.Email, user.Email)
            };

            var token = new JwtSecurityToken(
                _config["Jwt:Issuer"], _config["Jwt:Audience"], claims,
                expires: DateTime.Now.AddMinutes(120), // תוקף לשעתיים
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}