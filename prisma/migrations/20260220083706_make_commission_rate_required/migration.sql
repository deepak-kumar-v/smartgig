/*
  Warnings:

  - Made the column `commissionRate` on table `Contract` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Contract" ALTER COLUMN "commissionRate" SET NOT NULL;
