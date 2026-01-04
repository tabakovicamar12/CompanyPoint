using CommonLibrary;
using HolidayService.Features.Holidays.Models.Request;
using HolidayService.Features.Holidays.Models.Response;
using HolidayService.Features.User;
using HolidayService.Infrastructure.Database;
using HolidayService.Infrastructure.Database.Entities.Enums;
using HolidayService.Infrastructure.Database.Entities.Holiday;
using Microsoft.EntityFrameworkCore.ChangeTracking;

namespace HolidayService.Features.Holidays
{
    public class HolidaysSerivce
    {
        private readonly HolidayDAO _holidayDAO;
        private readonly UserInfoService _userInfoService;

        public HolidaysSerivce(HolidayDAO holidayDAO,UserInfoService userInfoService)
        {
            _holidayDAO = holidayDAO;
            _userInfoService = userInfoService;
        }

        public async Task<Result<HolidayRequestResponse>> RequestHolidayAsync(HolidayRequest request)
        {

            string employeeId = _userInfoService.GetUserId();

            HolidayEntity holidayEntity = new HolidayEntity
            {
                EmployeeId = employeeId, 
                StartDate = request.StartDate,
                EndDate = request.EndDate,
                Reason = request.Reason,
                Status = HolidayStatusEnum.Pending
            };

            Result createHolidayRequest = await _holidayDAO.Add(holidayEntity);
            if (createHolidayRequest.Failure)
            {
                return Result.Fail<HolidayRequestResponse>("Failed to create your holiday request");
            }

            HolidayRequestResponse response = new HolidayRequestResponse
            {
                RequestId = holidayEntity.Id,
                Status = holidayEntity.Status.ToString()
            };

            return Result.Ok(response);
        }

        public async Task<Result<HolidayRequestsResponse>> GetAllHolidayRequestsAsync()
        {
            List<HolidayEntity> holidayEntities = await _holidayDAO.Get();
            List<HolidayResponse> holidayResponses = holidayEntities.Select(he => new HolidayResponse
            {
                RequestId = he.Id,
                EmployeeId = he.EmployeeId,
                StartDate = he.StartDate,
                EndDate = he.EndDate,
                Status = he.Status,
                Reason = he.Reason
            }).ToList();

            HolidayRequestsResponse response = new HolidayRequestsResponse
            {
                HolidayRequests = holidayResponses
            };
            return Result.Ok(response);
        }

        public async Task<Result<HolidayRequestsResponse>> GetHolidayRequestsByEmployeeAsync(ByEmployeRequest request)
        {
            List<HolidayEntity>? holidayEntities = await _holidayDAO.Get(filterConfig: new HolidayFilterConfig { EmployeeId = request.EmployeeId });
            if (holidayEntities == null)
            {
                return Result.Fail<HolidayRequestsResponse>("No holiday requests found for the specified employee.");
            }
            List<HolidayResponse> holidayResponses = holidayEntities.Select(he => new HolidayResponse
            {
                RequestId = he.Id,
                EmployeeId = he.EmployeeId,
                StartDate = he.StartDate,
                EndDate = he.EndDate,
                Status = he.Status,
                Reason = he.Reason
            }).ToList();

            HolidayRequestsResponse response = new HolidayRequestsResponse
            {
                HolidayRequests = holidayResponses
            };

            return Result.Ok(response);
        }

        public async Task<Result<HolidayRequestResponse>> ApproveHolidayRequestAsync(Guid requestId)
        {
            HolidayEntity? holidayEntity = await _holidayDAO.Get(requestId);
            if (holidayEntity == null)
            {
                return Result.Fail<HolidayRequestResponse>("Holiday request not found.");
            }

            holidayEntity.Status = HolidayStatusEnum.Approved;
            Result updateResult = await _holidayDAO.Update(holidayEntity);
            if (updateResult.Failure)
            {
                return Result.Fail<HolidayRequestResponse>("Failed to approve the holiday request.");
            }
            HolidayRequestResponse response = new HolidayRequestResponse
            {
                RequestId = holidayEntity.Id,
                Status = holidayEntity.Status.ToString()
            };
            return Result.Ok(response);
        }

        public async Task<Result<HolidayRequestResponse>> RejectHolidayRequestAsync(Guid requestId)
        {
            HolidayEntity? holidayEntity = await _holidayDAO.Get(requestId);
            if (holidayEntity == null)
            {
                return Result.Fail<HolidayRequestResponse>("Holiday request not found.");
            }

            holidayEntity.Status = HolidayStatusEnum.Rejected;
            Result updateResult = await _holidayDAO.Update(holidayEntity);
            if (updateResult.Failure)
            {
                return Result.Fail<HolidayRequestResponse>("Failed to reject the holiday request.");
            }
            HolidayRequestResponse response = new HolidayRequestResponse
            {
                RequestId = holidayEntity.Id,
                Status = holidayEntity.Status.ToString()
            };
            return Result.Ok(response);
        }

        public async Task<Result<DeleteHolidayRequestResponse>> DeleteHolidayRequestAsync(Guid requestId)
        {
            HolidayEntity? holidayEntity = await _holidayDAO.Get(requestId);
            if (holidayEntity == null)
            {
                return Result.Fail<DeleteHolidayRequestResponse>("Holiday request not found.");
            }
            Result deleteResult = await _holidayDAO.Remove(holidayEntity);
            if (deleteResult.Failure)
            {
                return Result.Fail<DeleteHolidayRequestResponse>("Failed to delete the holiday request.");
            }
            DeleteHolidayRequestResponse response = new DeleteHolidayRequestResponse
            {
                RequestId = holidayEntity.Id,
                Message = "Holiday request deleted successfully."
            };
            return Result.Ok(response);
        }

        public async Task<Result<DeleteEmployeesHolidaysResponse>> DeleteAllEmployeesHolidayRequests(ByEmployeRequest request)
        {
            List<HolidayEntity>? holidayEntities = await _holidayDAO.Get(filterConfig: new HolidayFilterConfig { EmployeeId = request.EmployeeId });
            DeleteEmployeesHolidaysResponse response = new DeleteEmployeesHolidaysResponse
            {
                DeletedHolidayIds = new List<Guid>(),
                Message = ""
            };

            if (holidayEntities == null || !holidayEntities.Any())
            {
                return Result.Fail<DeleteEmployeesHolidaysResponse>("No holiday requests found for the specified employee.");
            }
            foreach (var holidayEntity in holidayEntities)
            {
                Result deleteResult = await _holidayDAO.Remove(holidayEntity);
                if (deleteResult.Failure)
                {
                    return Result.Fail<DeleteEmployeesHolidaysResponse>("Failed to delete one or more holiday requests.");
                }
                response.DeletedHolidayIds.Add(holidayEntity.Id);
            }

            response.Message = "All holiday requests for the specified employee have been deleted successfully.";
            return Result.Ok(response);
        }

    }
}
