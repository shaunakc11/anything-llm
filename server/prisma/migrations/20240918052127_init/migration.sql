-- CreateTable
CREATE TABLE "workspace_documents_year" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "filename" TEXT NOT NULL,
    "docpath" TEXT NOT NULL,
    "docId" TEXT NOT NULL,
    "year" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
