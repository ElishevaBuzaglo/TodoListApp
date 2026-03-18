namespace TodoApi.DTOs
{
    public class AuthDto
    {
        // המזהה הראשי לכניסה/רישום
        public string Email { get; set; } = null!;
        
        // הסיסמה הגלויה (תהפוך ל-Hash בשרת)
        public string Password { get; set; } = null!;
        
        // שם המשתמש (נשלח רק בהרשמה)
        public string? Username { get; set; } 
    }
}