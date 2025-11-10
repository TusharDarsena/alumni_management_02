-- AlterTable
ALTER TABLE "JobListing" ADD COLUMN "eligibleBranches" TEXT;
ALTER TABLE "JobListing" ADD COLUMN "eligibleRoles" TEXT;
ALTER TABLE "JobListing" ADD COLUMN "postedBy" TEXT;

-- CreateIndex
CREATE INDEX "JobListing_postedBy_idx" ON "JobListing"("postedBy");
