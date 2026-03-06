-- CreateTable
CREATE TABLE "Bundle" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "type" TEXT NOT NULL DEFAULT 'quantity_break',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "visibility" TEXT NOT NULL DEFAULT 'all',
    "productIds" TEXT NOT NULL DEFAULT '[]',
    "collectionIds" TEXT NOT NULL DEFAULT '[]',
    "settings" TEXT NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bundle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BundleTier" (
    "id" TEXT NOT NULL,
    "bundleId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "compareAtPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discountPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isPopular" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "BundleTier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BundleStats" (
    "id" TEXT NOT NULL,
    "bundleId" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "visitors" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "revenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BundleStats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Bundle_shop_active_idx" ON "Bundle"("shop", "active");

-- CreateIndex
CREATE INDEX "BundleTier_bundleId_idx" ON "BundleTier"("bundleId");

-- CreateIndex
CREATE INDEX "BundleStats_bundleId_date_idx" ON "BundleStats"("bundleId", "date");

-- CreateIndex
CREATE INDEX "BundleStats_shop_date_idx" ON "BundleStats"("shop", "date");

-- AddForeignKey
ALTER TABLE "BundleTier" ADD CONSTRAINT "BundleTier_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "Bundle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BundleStats" ADD CONSTRAINT "BundleStats_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "Bundle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
