-- CreateTable
CREATE TABLE "fields" (
    "id" UUID NOT NULL,
    "ownerId" UUID NOT NULL,
    "fieldCode" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "region" TEXT,
    "cropDefault" TEXT,
    "approximateAreaHa" DECIMAL(10,4),
    "privacyLevel" TEXT NOT NULL DEFAULT 'standard',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "machines" (
    "id" UUID NOT NULL,
    "ownerId" UUID NOT NULL,
    "machineCode" TEXT NOT NULL,
    "machineType" TEXT NOT NULL,
    "publicKeyHex" TEXT,
    "vendorVisible" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'registered',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "machines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "machine_sessions" (
    "id" UUID NOT NULL,
    "fieldId" UUID NOT NULL,
    "machineId" UUID NOT NULL,
    "operationType" TEXT NOT NULL,
    "crop" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3) NOT NULL,
    "areaCoveredHa" DECIMAL(10,4),
    "yieldKgApprox" DECIMAL(14,4),
    "rawLogHash" TEXT NOT NULL,
    "gpsPathHash" TEXT NOT NULL,
    "gpsPathPreview" JSONB NOT NULL,
    "photoHashes" JSONB NOT NULL DEFAULT '[]',
    "importedJsonEncryptedRef" TEXT,
    "importSource" TEXT NOT NULL DEFAULT 'json',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "machine_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evidence_packets" (
    "id" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "packetSchema" TEXT NOT NULL,
    "packetJson" JSONB NOT NULL,
    "packetHash" TEXT NOT NULL,
    "canonicalization" TEXT NOT NULL DEFAULT 'RFC8785-like',
    "assuranceLevel" TEXT NOT NULL DEFAULT 'AL1',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "farmerSignature" TEXT,
    "reviewerSignature" TEXT,
    "publicVerifySlug" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "signedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),

    CONSTRAINT "evidence_packets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "constellation_submissions" (
    "id" UUID NOT NULL,
    "evidencePacketId" UUID NOT NULL,
    "constellationEventId" TEXT,
    "constellationHash" TEXT,
    "accepted" BOOLEAN,
    "message" TEXT,
    "requestPayload" JSONB NOT NULL,
    "responsePayload" JSONB NOT NULL,
    "mode" TEXT NOT NULL DEFAULT 'mock',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "constellation_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_events" (
    "id" UUID NOT NULL,
    "evidencePacketId" UUID NOT NULL,
    "verifierType" TEXT,
    "result" TEXT NOT NULL,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "fields_fieldCode_key" ON "fields"("fieldCode");

-- CreateIndex
CREATE UNIQUE INDEX "machines_machineCode_key" ON "machines"("machineCode");

-- CreateIndex
CREATE UNIQUE INDEX "evidence_packets_packetHash_key" ON "evidence_packets"("packetHash");

-- CreateIndex
CREATE UNIQUE INDEX "evidence_packets_publicVerifySlug_key" ON "evidence_packets"("publicVerifySlug");

-- AddForeignKey
ALTER TABLE "machine_sessions" ADD CONSTRAINT "machine_sessions_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "fields"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "machine_sessions" ADD CONSTRAINT "machine_sessions_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "machines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence_packets" ADD CONSTRAINT "evidence_packets_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "machine_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "constellation_submissions" ADD CONSTRAINT "constellation_submissions_evidencePacketId_fkey" FOREIGN KEY ("evidencePacketId") REFERENCES "evidence_packets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_events" ADD CONSTRAINT "verification_events_evidencePacketId_fkey" FOREIGN KEY ("evidencePacketId") REFERENCES "evidence_packets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
