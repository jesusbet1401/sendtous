-- Enable RLS on all tables
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Supplier" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Product" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Shipment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ShipmentItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CostLine" ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations for authenticated users
-- (ajusta según tu lógica de negocio)

-- User policies
CREATE POLICY "Allow all for authenticated users" ON "User"
  FOR ALL USING (true);

-- Supplier policies
CREATE POLICY "Allow all for authenticated users" ON "Supplier"
  FOR ALL USING (true);

-- Product policies
CREATE POLICY "Allow all for authenticated users" ON "Product"
  FOR ALL USING (true);

-- Shipment policies
CREATE POLICY "Allow all for authenticated users" ON "Shipment"
  FOR ALL USING (true);

-- ShipmentItem policies
CREATE POLICY "Allow all for authenticated users" ON "ShipmentItem"
  FOR ALL USING (true);

-- CostLine policies
CREATE POLICY "Allow all for authenticated users" ON "CostLine"
  FOR ALL USING (true);
