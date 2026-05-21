-- CreateTable
CREATE TABLE "setup_status" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "is_setup" BOOLEAN NOT NULL DEFAULT false,
    "site_name" TEXT NOT NULL DEFAULT 'LightTicket',
    "site_url" TEXT,
    "accent_color" TEXT NOT NULL DEFAULT '#111111',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
