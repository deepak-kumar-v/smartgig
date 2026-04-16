-- AlterTable
ALTER TABLE "FreelancerProfile" ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "currency" TEXT DEFAULT 'USD',
ADD COLUMN     "experienceLevel" TEXT DEFAULT 'INTERMEDIATE',
ADD COLUMN     "timezone" TEXT,
ADD COLUMN     "weeklyHours" INTEGER DEFAULT 40;
