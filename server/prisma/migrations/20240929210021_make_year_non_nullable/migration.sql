/*
  Warnings:

  - Made the column `year` on table `workspaces` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "workspaces" ALTER COLUMN "year" SET NOT NULL;
