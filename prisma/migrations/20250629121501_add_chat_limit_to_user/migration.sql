/*
  Warnings:

  - You are about to drop the column `limit` on the `Chat` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "status" AS ENUM ('WAITING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- AlterTable
ALTER TABLE "Chat" DROP COLUMN "limit",
ADD COLUMN     "status" "status" NOT NULL DEFAULT 'WAITING';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "limit" INTEGER DEFAULT 5;
