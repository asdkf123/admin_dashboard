-- CreateEnum
CREATE TYPE "TicketCategory" AS ENUM ('fault', 'maintenance_request', 'inquiry', 'other');

-- CreateEnum
CREATE TYPE "TicketPriority" AS ENUM ('low', 'normal', 'high', 'urgent');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('open', 'in_progress', 'resolved', 'closed', 'cancelled');

-- CreateEnum
CREATE TYPE "InspectionStatus" AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "InspectionResult" AS ENUM ('pass', 'fail', 'needs_repair');

-- CreateTable
CREATE TABLE "maintenance_tickets" (
    "id" TEXT NOT NULL,
    "station_id" TEXT NOT NULL,
    "charger_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "TicketCategory" NOT NULL DEFAULT 'fault',
    "priority" "TicketPriority" NOT NULL DEFAULT 'normal',
    "status" "TicketStatus" NOT NULL DEFAULT 'open',
    "reporter_user_id" TEXT NOT NULL,
    "assignee_user_id" TEXT,
    "resolution" TEXT,
    "resolved_at" TIMESTAMP(3),
    "closed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maintenance_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspections" (
    "id" TEXT NOT NULL,
    "station_id" TEXT NOT NULL,
    "charger_id" TEXT,
    "inspector_user_id" TEXT,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "performed_at" TIMESTAMP(3),
    "status" "InspectionStatus" NOT NULL DEFAULT 'scheduled',
    "result" "InspectionResult",
    "notes" TEXT,
    "next_scheduled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inspections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "maintenance_tickets_station_id_status_idx" ON "maintenance_tickets"("station_id", "status");

-- CreateIndex
CREATE INDEX "maintenance_tickets_status_priority_created_at_idx" ON "maintenance_tickets"("status", "priority", "created_at");

-- CreateIndex
CREATE INDEX "maintenance_tickets_reporter_user_id_idx" ON "maintenance_tickets"("reporter_user_id");

-- CreateIndex
CREATE INDEX "maintenance_tickets_assignee_user_id_idx" ON "maintenance_tickets"("assignee_user_id");

-- CreateIndex
CREATE INDEX "inspections_station_id_scheduled_at_idx" ON "inspections"("station_id", "scheduled_at");

-- CreateIndex
CREATE INDEX "inspections_status_scheduled_at_idx" ON "inspections"("status", "scheduled_at");

-- AddForeignKey
ALTER TABLE "maintenance_tickets" ADD CONSTRAINT "maintenance_tickets_reporter_user_id_fkey" FOREIGN KEY ("reporter_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_tickets" ADD CONSTRAINT "maintenance_tickets_assignee_user_id_fkey" FOREIGN KEY ("assignee_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspections" ADD CONSTRAINT "inspections_inspector_user_id_fkey" FOREIGN KEY ("inspector_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
