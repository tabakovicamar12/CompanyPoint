namespace HolidayService.Features.Holidays.Models.Response
{
    public class DeleteEmployeesHolidaysResponse
    {
        public List<Guid> DeletedHolidayIds { get; set; }
        public string Message { get; set; }
    }
}
