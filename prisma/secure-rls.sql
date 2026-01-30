-- Drop existing permissive policies
DROP POLICY IF EXISTS "Allow all for authenticated users" ON "User";
DROP POLICY IF EXISTS "Allow all for authenticated users" ON "Supplier";
DROP POLICY IF EXISTS "Allow all for authenticated users" ON "Product";
DROP POLICY IF EXISTS "Allow all for authenticated users" ON "Shipment";
DROP POLICY IF EXISTS "Allow all for authenticated users" ON "ShipmentItem";
DROP POLICY IF EXISTS "Allow all for authenticated users" ON "CostLine";

-- 1. User: Users can only see themselves (or everyone?) and edit only themselves
-- Assuming "View All" is needed for finding users, but Edit is strict
CREATE POLICY "Users can view all users" ON "User"
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can edit own profile" ON "User"
  FOR UPDATE
  TO authenticated
  USING (
    -- Adjust this if your ID logic differs (e.g. auth.uid()::text)
    id = auth.uid()::text
  )
  WITH CHECK (
    id = auth.uid()::text
  );

-- 2. Supplier: Shared resource, authenticated users can Read/Write (Team access)
CREATE POLICY "Authenticated can view suppliers" ON "Supplier"
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can manage suppliers" ON "Supplier"
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3. Product: Shared resource
CREATE POLICY "Authenticated can view products" ON "Product"
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can manage products" ON "Product"
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4. Shipment: Shared resource (or strict ownership?)
-- Giving team access for now, but strictly authenticated
CREATE POLICY "Authenticated can view shipments" ON "Shipment"
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can manage shipments" ON "Shipment"
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 5. ShipmentItem & CostLine (Cascading access usually, but staying simple for teamwork)
CREATE POLICY "Authenticated can view shipment items" ON "ShipmentItem"
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can manage shipment items" ON "ShipmentItem"
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated can view cost lines" ON "CostLine"
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can manage cost lines" ON "CostLine"
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
