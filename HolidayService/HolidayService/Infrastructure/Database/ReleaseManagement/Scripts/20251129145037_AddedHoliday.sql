CREATE TABLE IF NOT EXISTS "__EFMigrationsHistory" (
    "MigrationId" character varying(150) NOT NULL,
    "ProductVersion" character varying(32) NOT NULL,
    CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY ("MigrationId")
);



CREATE TABLE "Holidays" (
    "Id" uuid NOT NULL,
    "EmployeeId" uuid NOT NULL,
    "StartDate" timestamp with time zone NOT NULL,
    "EndDate" timestamp with time zone NOT NULL,
    "Status" integer NOT NULL,
    "Reason" text NOT NULL,
    "CreatedTimestamp" timestamp with time zone NOT NULL,
    "ModifiedTimestamp" timestamp with time zone NOT NULL,
    CONSTRAINT "PK_Holidays" PRIMARY KEY ("Id")
);

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20251129145037_AddedHoliday', '8.0.5');



