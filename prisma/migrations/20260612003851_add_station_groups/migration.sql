-- CreateTable
CREATE TABLE "station_groups" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT NOT NULL DEFAULT '#1570EF',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "station_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "station_group_members" (
    "id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "station_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "station_group_members_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "station_groups_name_key" ON "station_groups"("name");

-- CreateIndex
CREATE INDEX "station_group_members_station_id_idx" ON "station_group_members"("station_id");

-- CreateIndex
CREATE UNIQUE INDEX "station_group_members_group_id_station_id_key" ON "station_group_members"("group_id", "station_id");

-- AddForeignKey
ALTER TABLE "station_group_members" ADD CONSTRAINT "station_group_members_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "station_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
