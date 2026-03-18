FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# העתקת קובץ הפרויקט וביצוע Restore
COPY ["TodoApi.csproj", "./"]
RUN dotnet restore "TodoApi.csproj"

# העתקת שאר הקבצים ובנייה
COPY . .
RUN dotnet publish "TodoApi.csproj" -c Release -o /app/publish

# שלב ההרצה
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "TodoApi.dll"]