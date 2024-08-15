/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `Task` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[binId]` on the table `Task` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `binId` to the `Task` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "binId" TEXT NOT NULL,
ALTER COLUMN "isCancelled" SET DEFAULT false,
ALTER COLUMN "isDeleted" SET DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "Task_userId_key" ON "Task"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Task_binId_key" ON "Task"("binId");

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_binId_fkey" FOREIGN KEY ("binId") REFERENCES "Bin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
