-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'USER', 'VIEWER');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('CLP', 'USD', 'EUR', 'GBP');

-- CreateEnum
CREATE TYPE "TransportMethod" AS ENUM ('MARITIME', 'AIR');

-- CreateEnum
CREATE TYPE "ShipmentStatus" AS ENUM ('DRAFT', 'IN_TRANSIT', 'IN_CUSTOMS', 'RELEASED', 'DELIVERED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'USD',
    "contactName" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "address" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "priceFob" DOUBLE PRECISION,
    "currency" "Currency",
    "hsCode" TEXT,
    "weight" DOUBLE PRECISION,
    "volume" DOUBLE PRECISION,
    "category" TEXT,
    "imageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "lastLandedCostClp" DOUBLE PRECISION,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shipment" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "transportMethod" "TransportMethod" NOT NULL,
    "blOrAwb" TEXT,
    "carrier" TEXT,
    "origin" TEXT,
    "destination" TEXT,
    "etd" TIMESTAMP(3),
    "eta" TIMESTAMP(3),
    "ata" TIMESTAMP(3),
    "customsAgent" TEXT,
    "hasOriginCert" BOOLEAN NOT NULL DEFAULT false,
    "status" "ShipmentStatus" NOT NULL,
    "exchangeRateUsd" DOUBLE PRECISION,
    "exchangeRateEur" DOUBLE PRECISION,
    "exchangeRateGbp" DOUBLE PRECISION,
    "purchaseRateUsd" DOUBLE PRECISION,
    "purchaseRateEur" DOUBLE PRECISION,
    "purchaseRateGbp" DOUBLE PRECISION,
    "exchangeRateEurToUsd" DOUBLE PRECISION,
    "exchangeRateGbpToUsd" DOUBLE PRECISION,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShipmentItem" (
    "id" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPriceFob" DOUBLE PRECISION NOT NULL,
    "unitCostClp" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShipmentItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CostLine" (
    "id" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'USD',
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CostLine_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Supplier_name_idx" ON "Supplier"("name");

-- CreateIndex
CREATE INDEX "Supplier_country_idx" ON "Supplier"("country");

-- CreateIndex
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");

-- CreateIndex
CREATE INDEX "Product_supplierId_idx" ON "Product"("supplierId");

-- CreateIndex
CREATE INDEX "Product_name_idx" ON "Product"("name");

-- CreateIndex
CREATE INDEX "Product_category_idx" ON "Product"("category");

-- CreateIndex
CREATE UNIQUE INDEX "Shipment_reference_key" ON "Shipment"("reference");

-- CreateIndex
CREATE INDEX "Shipment_supplierId_idx" ON "Shipment"("supplierId");

-- CreateIndex
CREATE INDEX "Shipment_createdById_idx" ON "Shipment"("createdById");

-- CreateIndex
CREATE INDEX "Shipment_status_idx" ON "Shipment"("status");

-- CreateIndex
CREATE INDEX "Shipment_createdAt_idx" ON "Shipment"("createdAt");

-- CreateIndex
CREATE INDEX "ShipmentItem_shipmentId_idx" ON "ShipmentItem"("shipmentId");

-- CreateIndex
CREATE INDEX "ShipmentItem_productId_idx" ON "ShipmentItem"("productId");

-- CreateIndex
CREATE INDEX "CostLine_shipmentId_idx" ON "CostLine"("shipmentId");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShipmentItem" ADD CONSTRAINT "ShipmentItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShipmentItem" ADD CONSTRAINT "ShipmentItem_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CostLine" ADD CONSTRAINT "CostLine_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
