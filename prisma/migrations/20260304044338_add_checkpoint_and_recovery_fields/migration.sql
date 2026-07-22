-- CreateEnum
CREATE TYPE "JobCheckpoint" AS ENUM ('INIT', 'FILE_RETRIEVED', 'FILE_PROCESSED', 'UPLOADED_TO_STORAGE', 'METADATA_UPDATED', 'COMPLETED');

-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "checkpoint" "JobCheckpoint" NOT NULL DEFAULT 'INIT',
ADD COLUMN     "checkpointData" JSONB,
ADD COLUMN     "lastCheckpointAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Job_checkpoint_idx" ON "Job"("checkpoint");
