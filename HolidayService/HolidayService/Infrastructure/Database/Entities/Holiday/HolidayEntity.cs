using CommonLibrary.Database;
using HolidayService.Infrastructure.Database.Entities.Enums;

namespace HolidayService.Infrastructure.Database.Entities.Holiday
{
    public class HolidayEntity : IGuidIdEntity, ICreatedTimestampEntity, IModifiedTimestampEntity
    {
        public Guid Id { get; set; }
        public string EmployeeId { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public HolidayStatusEnum Status { get; set; }
        public string Reason { get; set; }
        public DateTimeOffset CreatedTimestamp { get; set; }
        public DateTimeOffset ModifiedTimestamp { get; set; }
    }
}
