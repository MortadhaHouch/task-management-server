/*
  Warnings:

  - Added the required column `startingDate` to the `Task` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "startingDate" TEXT NOT NULL;
