using HolidayService.Infrastructure.Database.Entities.Enums;

namespace HolidayService.Features.Holidays.Models.Response
{
    public class HolidayResponse
    {
        public Guid RequestId { get; set; }
        public string EmployeeId { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public HolidayStatusEnum Status { get; set; }
        public string Reason { get; set; }
    }
}
