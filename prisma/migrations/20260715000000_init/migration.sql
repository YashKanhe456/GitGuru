-- CreateTable
CREATE TABLE "Repository" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "defaultBranch" TEXT,
    "clonePath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Repository_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RepositoryCloneJob" (
    "id" TEXT NOT NULL,
    "repositoryUrl" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "clonePath" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RepositoryCloneJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Repository_url_key" ON "Repository"("url");
