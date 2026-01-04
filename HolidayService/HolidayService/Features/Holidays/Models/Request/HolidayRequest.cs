using FluentValidation;

namespace HolidayService.Features.Holidays.Models.Request
{
    public class HolidayRequest
    {
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string Reason { get; set; }

        public class HolidayRequestValidator : AbstractValidator<HolidayRequest>
        {
            public HolidayRequestValidator()
            {
                RuleFor(x => x.Reason)
                    .NotEmpty()
                    .WithMessage("Must provide a reason");

                RuleFor(x => x.EndDate)
                    .GreaterThanOrEqualTo(x => x.StartDate)
                    .WithMessage("EndDate must be the same or after StartDate");

            }
        }
    }
}
