-- CreateEnum
CREATE TYPE "Role" AS ENUM ('BUYER', 'LANDOWNER', 'WORKER', 'INSPECTOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "StageKind" AS ENUM ('PREPARATION', 'PLANTING', 'EARLY_GROWTH', 'VEGETATIVE_GROWTH', 'REPRODUCTIVE', 'MATURITY', 'HARVEST', 'POST_HARVEST');

-- CreateEnum
CREATE TYPE "LandStatus" AS ENUM ('AVAILABLE', 'RESERVED', 'UNDER_CONTRACT', 'UNAVAILABLE');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'OFFERED', 'PARTIALLY_ACCEPTED', 'AWAITING_BUYER_DECISION', 'ACTIVE', 'AT_RISK', 'COMPLETED', 'DECLINED', 'CANCELLED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'UPCOMING', 'ACTIVE', 'SUBMITTED_FOR_REVIEW', 'REVIEW_REQUIRED', 'COMPLETED', 'SKIPPED', 'DELAYED', 'REJECTED');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('OPEN', 'PARTIALLY_FILLED', 'FILLED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InspectionStatus" AS ENUM ('SCHEDULED', 'ACCEPTED', 'IN_PROGRESS', 'SUBMITTED', 'VERIFIED', 'VERIFIED_WITH_OBSERVATIONS', 'EVIDENCE_MISMATCH', 'REINSPECTION_REQUIRED', 'HIGH_RISK', 'SUSPECTED_FRAUD', 'FAILED');

-- CreateEnum
CREATE TYPE "ConfigValueType" AS ENUM ('INT', 'DECIMAL', 'BIGINT_PAISE', 'BOOLEAN', 'STRING', 'JSON');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'EMAIL', 'SMS');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "fullName" TEXT NOT NULL,
    "contactPhone" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRole" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "role" "Role" NOT NULL,
    "grantedBy" UUID,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CropCategory" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CropCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Crop" (
    "id" UUID NOT NULL,
    "categoryId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "planningYieldPerAcreKg" INTEGER NOT NULL,
    "forecastYieldPerAcreKg" INTEGER NOT NULL,
    "preparationLeadDays" INTEGER NOT NULL DEFAULT 7,
    "durationDays" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Crop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CropPlan" (
    "id" UUID NOT NULL,
    "cropId" UUID NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CropPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CropStage" (
    "id" UUID NOT NULL,
    "planId" UUID NOT NULL,
    "kind" "StageKind" NOT NULL,
    "name" TEXT NOT NULL,
    "startDayOffset" INTEGER NOT NULL,
    "endDayOffset" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "workerFactorPerAcre" DECIMAL(6,3) NOT NULL,
    "taskFactor" DECIMAL(6,3) NOT NULL DEFAULT 1.0,
    "requiresEvidence" BOOLEAN NOT NULL DEFAULT true,
    "requiresGpsCheckIn" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "CropStage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformConfig" (
    "key" TEXT NOT NULL,
    "valueType" "ConfigValueType" NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "prdSection" TEXT,
    "updatedBy" UUID,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformConfig_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" UUID NOT NULL,
    "actorId" UUID,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "fromState" TEXT,
    "toState" TEXT,
    "action" TEXT NOT NULL,
    "reason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL DEFAULT 'IN_APP',
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE INDEX "User_isDemo_idx" ON "User"("isDemo");

-- CreateIndex
CREATE INDEX "UserRole_role_idx" ON "UserRole"("role");

-- CreateIndex
CREATE UNIQUE INDEX "UserRole_userId_role_key" ON "UserRole"("userId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "CropCategory_name_key" ON "CropCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "CropCategory_slug_key" ON "CropCategory"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Crop_slug_key" ON "Crop"("slug");

-- CreateIndex
CREATE INDEX "Crop_categoryId_idx" ON "Crop"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "CropPlan_cropId_key" ON "CropPlan"("cropId");

-- CreateIndex
CREATE INDEX "CropStage_planId_idx" ON "CropStage"("planId");

-- CreateIndex
CREATE UNIQUE INDEX "CropStage_planId_sortOrder_key" ON "CropStage"("planId", "sortOrder");

-- CreateIndex
CREATE INDEX "PlatformConfig_valueType_idx" ON "PlatformConfig"("valueType");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_idx" ON "Notification"("userId", "readAt");

-- CreateIndex
CREATE INDEX "Notification_type_idx" ON "Notification"("type");

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Crop" ADD CONSTRAINT "Crop_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "CropCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CropPlan" ADD CONSTRAINT "CropPlan_cropId_fkey" FOREIGN KEY ("cropId") REFERENCES "Crop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CropStage" ADD CONSTRAINT "CropStage_planId_fkey" FOREIGN KEY ("planId") REFERENCES "CropPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
