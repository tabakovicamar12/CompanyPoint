
using CommonLibrary.Attributes;
using CommonLibrary;
using Microsoft.AspNetCore.Mvc;

namespace HolidayService.Controllers
{
    [ApiController]
    [Route("/api/holidayservice/[controller]/[action]")]
    [ValidateRequest]
    public class BaseController : Controller
    {
        protected virtual IActionResult ToApiResult<TValue, TError>(Result<TValue, TError> result)
        {
            var resultService = HttpContext.RequestServices.GetRequiredService<ResultService>();
            return resultService.ToApiResult(result);
        }

        protected virtual IActionResult ToApiResult<TValue, TError, TWarning>(ResultWithWarning<TValue, TError, TWarning> result)
        {
            var resultService = HttpContext.RequestServices.GetRequiredService<ResultService>();
            return resultService.ToApiResult(result);
        }
    }
}
