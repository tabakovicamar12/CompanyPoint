using CommonLibrary;
using HolidayService.Features.Holidays;
using HolidayService.Features.Holidays.Models.Request;
using HolidayService.Features.Holidays.Models.Response;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HolidayService.Controllers
{
    [Authorize]
    public class HolidaysController : BaseController
    {
        private readonly HolidaysSerivce _holidaysService;

        public HolidaysController(HolidaysSerivce holidaysSerivce)
        {
            _holidaysService = holidaysSerivce;
        }

        [HttpPost]
        public async Task<IActionResult> RequestHoliday(HolidayRequest request)
        {
            Result<HolidayRequestResponse> result = await _holidaysService.RequestHolidayAsync(request);
            return ToApiResult(result);
        }

        [HttpGet]
        public async Task<IActionResult> GetAllHolidayRequests()
        {
            Result<HolidayRequestsResponse> result = await _holidaysService.GetAllHolidayRequestsAsync();
            return ToApiResult(result);
        }

        [HttpGet]
        public async Task<IActionResult> GetHolidayRequestsByEmployee([FromQuery] ByEmployeRequest request)
        {
            Result<HolidayRequestsResponse> result = await _holidaysService.GetHolidayRequestsByEmployeeAsync(request);
            return ToApiResult(result);
        }

        [HttpPut]
        public async Task<IActionResult> ApproveHolidayRequest(Guid requestId)
        {
            Result<HolidayRequestResponse> result = await _holidaysService.ApproveHolidayRequestAsync(requestId);
            return ToApiResult(result);
        }

        [HttpPut]
        public async Task<IActionResult> RejectHolidayRequest(Guid requestId)
        {
            Result<HolidayRequestResponse> result = await _holidaysService.RejectHolidayRequestAsync(requestId);
            return ToApiResult(result);
        }

        [HttpDelete]
        public async Task<IActionResult> DeleteHolidayRequest(Guid requestId)
        {
            Result<DeleteHolidayRequestResponse> result = await _holidaysService.DeleteHolidayRequestAsync(requestId);
            return ToApiResult(result);
        }

        [HttpDelete]
        public async Task<IActionResult> DeleteAllEmployeesHolidayRequests([FromQuery] ByEmployeRequest request)
        {
            Result<DeleteEmployeesHolidaysResponse> result = await _holidaysService.DeleteAllEmployeesHolidayRequests(request);
            return ToApiResult(result);
        }
    }
}
