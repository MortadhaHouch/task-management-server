-- CreateTable
CREATE TABLE "User" (
    "name" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "id" SERIAL NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Post" (
    "content" TEXT NOT NULL,
    "createdOn" INTEGER NOT NULL,
    "updatedOn" INTEGER NOT NULL,
    "likes" INTEGER NOT NULL,
    "id" SERIAL NOT NULL,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_id_fkey" FOREIGN KEY ("id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
