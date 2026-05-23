-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_setup_status" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "is_setup" BOOLEAN NOT NULL DEFAULT false,
    "site_name" TEXT NOT NULL DEFAULT 'LightTicket',
    "site_url" TEXT,
    "require_login" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
INSERT INTO "new_setup_status" ("created_at", "id", "is_setup", "site_name", "site_url", "updated_at") SELECT "created_at", "id", "is_setup", "site_name", "site_url", "updated_at" FROM "setup_status";
DROP TABLE "setup_status";
ALTER TABLE "new_setup_status" RENAME TO "setup_status";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
