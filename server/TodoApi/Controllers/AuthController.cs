using Microsoft.AspNetCore.Mvc;
using TodoApi.DTOs;
using TodoApi.Services;

namespace TodoApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly AuthService _authService;
        public AuthController(AuthService authService) => _authService = authService;

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] AuthDto loginRequest)
        {
            var user = await _authService.Authenticate(loginRequest);
            if (user == null) return Unauthorized("אימייל או סיסמה שגויים");

            var token = _authService.GenerateToken(user);
            return Ok(new { token });
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] AuthDto registerRequest)
        {
            var success = await _authService.Register(registerRequest);
            if (!success) return BadRequest("האימייל כבר קיים במערכת");
            
            return Ok(new { message = "הרישום בוצע בהצלחה" });
        }
    }
}