-- Add sync_status column to drgreen_orders
ALTER TABLE drgreen_orders 
ADD COLUMN IF NOT EXISTS sync_status text DEFAULT 'pending';

-- Add sync timestamp
ALTER TABLE drgreen_orders 
ADD COLUMN IF NOT EXISTS synced_at timestamptz;

-- Add sync error tracking
ALTER TABLE drgreen_orders 
ADD COLUMN IF NOT EXISTS sync_error text;

-- Add index for filtering by sync status
CREATE INDEX IF NOT EXISTS idx_drgreen_orders_sync_status 
ON drgreen_orders(sync_status);

COMMENT ON COLUMN drgreen_orders.sync_status IS 'Sync status: pending, synced, failed, manual_review';

-- Allow admins to view all orders
CREATE POLICY "Admins can view all orders" ON drgreen_orders
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to update all orders
CREATE POLICY "Admins can update all orders" ON drgreen_orders
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));