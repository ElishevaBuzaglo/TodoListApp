namespace TodoApi.Models
{
    public partial class User
    {
        public int UserId { get; set; }
        
        // שם המשתמש שיוצג באפליקציה
        public string Username { get; set; } = null!;

        // האימייל הייחודי שמשמש להתחברות
        public string Email { get; set; } = null!;

        // הסיסמה המוצפנת (BCrypt)
        public string PasswordHash { get; set; } = null!;

        public DateTime? CreatedAt { get; set; }
    }
}