-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "coverImage" TEXT,
ADD COLUMN     "thumbnail" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isLoggedIn" BOOLEAN NOT NULL DEFAULT false;
