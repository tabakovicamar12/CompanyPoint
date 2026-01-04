
using CommonLibrary.User;
using FluentValidation;
using HolidayService.Features.Holidays;
using HolidayService.Features.Holidays.Models.Request;
using HolidayService.Features.User;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using static HolidayService.Features.Holidays.Models.Request.ByEmployeRequest;
using static HolidayService.Features.Holidays.Models.Request.HolidayRequest;

namespace HolidayService.Features
{
    public static class FeaturesDIExtensions
    {
        public static void AddFeatures(this IServiceCollection services, IConfiguration configuration)
        {
            services.AddScoped<HolidaysSerivce>();
            services.AddScoped<IUserInfoService, UserInfoService>();
            services.AddScoped<UserInfoService>();

            services.AddSingleton<IValidator<HolidayRequest>, HolidayRequestValidator>();

            services.AddSingleton<IValidator<ByEmployeRequest>, ByEmployeRequestValidator>();
        }
    }
}
