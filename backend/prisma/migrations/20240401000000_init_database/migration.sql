-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('OWNER', 'STAFF', 'ADMIN');

-- CreateEnum
CREATE TYPE "PartnershipStatus" AS ENUM ('PENDING', 'ACTIVE', 'PAUSED', 'REJECTED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "OfferStatus" AS ENUM ('DRAFT', 'ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "CommissionType" AS ENUM ('PERCENTAGE', 'FLAT');

-- CreateEnum
CREATE TYPE "CodeStatus" AS ENUM ('ISSUED', 'REDEEMED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('DUE', 'PARTIALLY_PAID', 'PAID', 'DISPUTED', 'VOID');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "contactName" TEXT,
    "phoneNumber" TEXT,
    "websiteUrl" TEXT,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "city" TEXT,
    "postalCode" TEXT,
    "country" TEXT DEFAULT 'FR',
    "role" "UserRole" NOT NULL DEFAULT 'OWNER',
    "timezone" TEXT DEFAULT 'Europe/Paris',
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Partnership" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "partnerAId" UUID NOT NULL,
    "partnerBId" UUID NOT NULL,
    "status" "PartnershipStatus" NOT NULL DEFAULT 'PENDING',
    "inviteToken" TEXT NOT NULL,
    "metadata" JSONB,
    "activatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Partnership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Offer" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "description" TEXT,
    "ownerId" UUID NOT NULL,
    "targetAudienceId" UUID NOT NULL,
    "partnershipId" UUID,
    "status" "OfferStatus" NOT NULL DEFAULT 'ACTIVE',
    "commissionType" "CommissionType" NOT NULL DEFAULT 'PERCENTAGE',
    "commissionValue" DECIMAL(10, 2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "redemptionNotes" TEXT,
    "maxPerClient" INTEGER,
    "isStackable" BOOLEAN NOT NULL DEFAULT false,
    "validFrom" TIMESTAMP(3),
    "validTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Offer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeneratedCode" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "codeString" TEXT NOT NULL,
    "offerId" UUID NOT NULL,
    "issuedById" UUID NOT NULL,
    "referringPartnerId" UUID NOT NULL,
    "redeemedById" UUID,
    "clientEmail" TEXT NOT NULL,
    "status" "CodeStatus" NOT NULL DEFAULT 'ISSUED',
    "expiresAt" TIMESTAMP(3),
    "redeemedAt" TIMESTAMP(3),
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "purchaseHintValue" DECIMAL(10, 2),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GeneratedCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "codeId" UUID NOT NULL,
    "referringPartnerId" UUID NOT NULL,
    "redeemingPartnerId" UUID NOT NULL,
    "commissionAmount" DECIMAL(12, 2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "saleAmount" DECIMAL(12, 2),
    "status" "TransactionStatus" NOT NULL DEFAULT 'DUE',
    "dueDate" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Partnership_inviteToken_key" ON "Partnership"("inviteToken");

-- CreateIndex
CREATE UNIQUE INDEX "Partnership_partnerAId_partnerBId_key" ON "Partnership"("partnerAId", "partnerBId");

-- CreateIndex
CREATE INDEX "Partnership_status_idx" ON "Partnership"("status");

-- CreateIndex
CREATE INDEX "Offer_partnershipId_idx" ON "Offer"("partnershipId");

-- CreateIndex
CREATE UNIQUE INDEX "GeneratedCode_codeString_key" ON "GeneratedCode"("codeString");

-- CreateIndex
CREATE INDEX "GeneratedCode_clientEmail_idx" ON "GeneratedCode"("clientEmail");

-- CreateIndex
CREATE INDEX "GeneratedCode_status_idx" ON "GeneratedCode"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_codeId_key" ON "Transaction"("codeId");

-- CreateIndex
CREATE INDEX "Transaction_referringPartnerId_idx" ON "Transaction"("referringPartnerId");

-- CreateIndex
CREATE INDEX "Transaction_redeemingPartnerId_idx" ON "Transaction"("redeemingPartnerId");

-- CreateIndex
CREATE INDEX "Transaction_status_idx" ON "Transaction"("status");

-- AddForeignKey
ALTER TABLE "Partnership" ADD CONSTRAINT "Partnership_partnerAId_fkey" FOREIGN KEY ("partnerAId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Partnership" ADD CONSTRAINT "Partnership_partnerBId_fkey" FOREIGN KEY ("partnerBId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_targetAudienceId_fkey" FOREIGN KEY ("targetAudienceId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_partnershipId_fkey" FOREIGN KEY ("partnershipId") REFERENCES "Partnership"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedCode" ADD CONSTRAINT "GeneratedCode_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedCode" ADD CONSTRAINT "GeneratedCode_issuedById_fkey" FOREIGN KEY ("issuedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedCode" ADD CONSTRAINT "GeneratedCode_referringPartnerId_fkey" FOREIGN KEY ("referringPartnerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedCode" ADD CONSTRAINT "GeneratedCode_redeemedById_fkey" FOREIGN KEY ("redeemedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_codeId_fkey" FOREIGN KEY ("codeId") REFERENCES "GeneratedCode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_referringPartnerId_fkey" FOREIGN KEY ("referringPartnerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_redeemingPartnerId_fkey" FOREIGN KEY ("redeemingPartnerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
