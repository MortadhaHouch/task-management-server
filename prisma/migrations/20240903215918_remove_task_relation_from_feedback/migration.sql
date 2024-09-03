/*
  Warnings:

  - You are about to drop the `_writtenFeedbacks` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `authorId` to the `Feedback` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "_writtenFeedbacks" DROP CONSTRAINT "_writtenFeedbacks_A_fkey";

-- DropForeignKey
ALTER TABLE "_writtenFeedbacks" DROP CONSTRAINT "_writtenFeedbacks_B_fkey";

-- DropIndex
DROP INDEX "Task_userId_key";

-- AlterTable
ALTER TABLE "Feedback" ADD COLUMN     "authorId" TEXT NOT NULL,
ADD COLUMN     "dislikes" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "likes" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "savedTemplates" TEXT[];

-- DropTable
DROP TABLE "_writtenFeedbacks";

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
