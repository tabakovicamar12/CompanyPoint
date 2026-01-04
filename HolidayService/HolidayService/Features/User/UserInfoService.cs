using CommonLibrary.User;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace HolidayService.Features.User
{
    public class UserInfoService : IUserInfoService
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly ILogger<UserInfoService> _logger;

        public UserInfoService(IHttpContextAccessor httpContextAccessor, ILogger<UserInfoService> logger)
        {
            _httpContextAccessor = httpContextAccessor;
            _logger = logger;
        }

        public Guid GetId()
        {
            throw new NotImplementedException();
        }

        public string GetLocale()
        {
            var httpContext = _httpContextAccessor.HttpContext;
            if (httpContext == null)
            {
                _logger.LogDebug("No HttpContext available when retrieving locale.");
                return string.Empty;
            }

            // Try claim first
            var claimLocale = httpContext.User.FindFirstValue("locale");
            if (!string.IsNullOrWhiteSpace(claimLocale))
            {
                return claimLocale;
            }

            // Fallback to Accept-Language header
            var acceptLang = httpContext.Request.Headers["Accept-Language"].ToString();
            if (!string.IsNullOrWhiteSpace(acceptLang))
            {
                // e.g. "en-US,en;q=0.9" -> take first token
                var first = acceptLang.Split(',').FirstOrDefault();
                return first ?? string.Empty;
            }

            return string.Empty;
        }

      

        public string GetUserId()
        {
            var user = _httpContextAccessor.HttpContext?.User;
            if (user == null)
            {
                _logger.LogDebug("No HttpContext/User available when retrieving user id (string).");
                return string.Empty;
            }

            var userIdString = user.FindFirstValue(ClaimTypes.NameIdentifier)
                               ?? user.FindFirstValue(JwtRegisteredClaimNames.Sub)
                               ?? user.FindFirstValue("id");

            if (!string.IsNullOrWhiteSpace(userIdString))
            {
                return userIdString;
            }

            _logger.LogWarning("Failed to get user id (string) from claims.");
            return string.Empty;
        }
    }
}
