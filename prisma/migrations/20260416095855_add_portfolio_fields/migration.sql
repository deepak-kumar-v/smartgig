-- AlterTable
ALTER TABLE "PortfolioItem" ADD COLUMN     "githubUrl" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "techStack" TEXT[];
