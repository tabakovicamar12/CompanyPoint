# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0-alpine AS build
WORKDIR /src

# Copy csproj first (better caching)
COPY HolidayService/HolidayService/HolidayService.csproj HolidayService/HolidayService/
COPY CommonLibrary/src/CommonLibrary/CommonLibrary.csproj CommonLibrary/src/CommonLibrary/

# Restore using the real path
RUN dotnet restore HolidayService/HolidayService/HolidayService.csproj

# Copy the rest of the source
COPY HolidayService/HolidayService/. HolidayService/HolidayService/
COPY CommonLibrary/src/CommonLibrary/. CommonLibrary/src/CommonLibrary/

# Publish using the real path
RUN dotnet publish HolidayService/HolidayService/HolidayService.csproj -c Release -o /app/publish

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
ENV ASPNETCORE_URLS=http://+:8080
COPY --from=build /app/publish .
EXPOSE 8080
ENTRYPOINT ["dotnet", "HolidayService.dll"]



