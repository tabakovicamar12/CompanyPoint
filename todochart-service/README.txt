ToDoChartService

ToDoChartService je ASP.NET Core REST mikroservis za upravljanje TO-DO seznamov in opravil (tasks) za zaposlene. Servis uporablja PostgreSQL, Entity Framework Core, JWT avtentikacijo in je namenjen delovanju v Docker okolju.

----------------------------------------------------------------

NAMEN SERVISA

- upravljanje TO-DO seznamov za zaposlene
- dodajanje, urejanje in brisanje opravil
- pridobivanje opravil po zaposlenem
- povezava z EmployeeService prek EmployeeId
- varen dostop prek AuthService (JWT)

----------------------------------------------------------------

UPORABLJENE TEHNOLOGIJE

- .NET / ASP.NET Core Web API
- Entity Framework Core
- PostgreSQL
- JWT Authentication
- Docker / Docker Compose
- Swagger (OpenAPI)

----------------------------------------------------------------

AVTENTIKACIJA

Vsi endpointi zahtevajo JWT Bearer token.

HTTP Header:
Authorization: Bearer <JWT_TOKEN>

Token pridobiš prek AuthService.

----------------------------------------------------------------

BASE URL

Lokalno (Docker):
http://localhost:5003

Swagger UI:
http://localhost:5003/swagger

----------------------------------------------------------------

API ENDPOINTI

TODO LISTE

Ustvari TO-DO seznam
POST /toDoChartService/todoLists

Body:
{
  "employeeId": 1,
  "title": "Daily tasks"
}

------------------------------------------------

Pridobi vse TO-DO sezname z opravili
GET /toDoChartService/todoLists

------------------------------------------------

Pridobi posamezen TO-DO seznam z opravili
GET /toDoChartService/todoLists/{id}

----------------------------------------------------------------

TASKI

Pridobi vsa opravila
GET /toDoChartService/tasks

------------------------------------------------

Pridobi opravila po zaposlenem
GET /toDoChartService/tasks/byEmployee/{employeeId}

------------------------------------------------

Dodaj opravilo na TO-DO seznam
POST /toDoChartService/tasks

Body:
{
  "todoListId": 1,
  "title": "Prepare report",
  "description": "Monthly sales report",
  "dueDate": "2026-01-20T12:00:00Z"
}

------------------------------------------------

Posodobi opravilo
PUT /toDoChartService/tasks/{taskId}

Body:
{
  "title": "Prepare final report",
  "description": "Updated description",
  "dueDate": "2026-01-22T12:00:00Z"
}

------------------------------------------------

Posodobi status opravila
PUT /toDoChartService/tasks/{taskId}/status

Body:
{
  "status": "Pending | InProgress | Done"
}

------------------------------------------------

Izbriši opravilo
DELETE /toDoChartService/tasks/{taskId}

------------------------------------------------

Izbriši vsa opravila zaposlenega
DELETE /toDoChartService/tasks/byEmployee/{employeeId}

----------------------------------------------------------------

PODATKOVNI MODEL

TodoList
- Id
- EmployeeId
- Title
- CreatedAt
- Tasks (seznam opravil)

TaskItem
- Id
- TodoListId
- Title
- Description
- Status
- DueDate
- CreatedAt
- UpdatedAt

Relacija:
TodoList 1 : N TaskItem

Navigacija TaskItem -> TodoList obstaja samo za EF Core in je označena z [JsonIgnore], da se prepreči JSON cikle.

----------------------------------------------------------------

DOCKER

Build in zagon servisa:
docker compose up -d --build todochart-service

Pregled logov:
docker logs todochart-service

----------------------------------------------------------------

POGOSTE NAPAKE

500 – JSON cycle detected
Vzrok: krožna referenca med TodoList in TaskItem
Rešitev: [JsonIgnore] na TaskItem.TodoList

Foreign key constraint error
Vzrok: neobstoječ TodoListId pri ustvarjanju taska

----------------------------------------------------------------

STATUS

Servis je funkcionalen, stabilen in pripravljen za integracijo v mikroservisno arhitekturo.
