-- CreateTable
CREATE TABLE "Analysis" (
    "id" TEXT NOT NULL,
    "repositoryId" TEXT NOT NULL,
    "defaultBranch" TEXT NOT NULL,
    "constraints" JSONB NOT NULL,
    "knowledgeModel" JSONB NOT NULL,
    "recommendations" JSONB NOT NULL,
    "truncated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Analysis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Analysis_repositoryId_createdAt_idx" ON "Analysis"("repositoryId", "createdAt");

-- AddForeignKey
ALTER TABLE "Analysis" ADD CONSTRAINT "Analysis_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "Repository"("id") ON DELETE CASCADE ON UPDATE CASCADE;
