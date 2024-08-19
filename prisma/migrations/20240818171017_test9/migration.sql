/*
  Warnings:

  - You are about to drop the column `binId` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `age` on the `User` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_binId_fkey";

-- DropIndex
DROP INDEX "Task_binId_key";

-- AlterTable
ALTER TABLE "Task" DROP COLUMN "binId";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "age";

-- CreateTable
CREATE TABLE "Feedback" (
    "content" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "likes" INTEGER NOT NULL,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_writtenFeedbacks" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_likedFeedbacks" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_dislikedFeedbacks" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_writtenFeedbacks_AB_unique" ON "_writtenFeedbacks"("A", "B");

-- CreateIndex
CREATE INDEX "_writtenFeedbacks_B_index" ON "_writtenFeedbacks"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_likedFeedbacks_AB_unique" ON "_likedFeedbacks"("A", "B");

-- CreateIndex
CREATE INDEX "_likedFeedbacks_B_index" ON "_likedFeedbacks"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_dislikedFeedbacks_AB_unique" ON "_dislikedFeedbacks"("A", "B");

-- CreateIndex
CREATE INDEX "_dislikedFeedbacks_B_index" ON "_dislikedFeedbacks"("B");

-- AddForeignKey
ALTER TABLE "_writtenFeedbacks" ADD CONSTRAINT "_writtenFeedbacks_A_fkey" FOREIGN KEY ("A") REFERENCES "Feedback"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_writtenFeedbacks" ADD CONSTRAINT "_writtenFeedbacks_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_likedFeedbacks" ADD CONSTRAINT "_likedFeedbacks_A_fkey" FOREIGN KEY ("A") REFERENCES "Feedback"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_likedFeedbacks" ADD CONSTRAINT "_likedFeedbacks_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_dislikedFeedbacks" ADD CONSTRAINT "_dislikedFeedbacks_A_fkey" FOREIGN KEY ("A") REFERENCES "Feedback"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_dislikedFeedbacks" ADD CONSTRAINT "_dislikedFeedbacks_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
