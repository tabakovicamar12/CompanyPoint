using FluentValidation;

namespace HolidayService.Features.Holidays.Models.Request
{
    public class ByEmployeRequest
    {
        public string EmployeeId { get; set; }

        public class ByEmployeRequestValidator : AbstractValidator<ByEmployeRequest>
        {
            public ByEmployeRequestValidator()
            {
                RuleFor(x => x.EmployeeId)
                    .NotEmpty().WithMessage("EmployeeId is required.");
            }
        }
    }
}
