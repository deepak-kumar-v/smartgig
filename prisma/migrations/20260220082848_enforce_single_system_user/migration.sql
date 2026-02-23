-- Enforce: at most ONE user with isSystem = true
-- PostgreSQL unique partial index (filtered unique constraint)
CREATE UNIQUE INDEX "User_isSystem_unique" ON "User" ("isSystem") WHERE "isSystem" = true;