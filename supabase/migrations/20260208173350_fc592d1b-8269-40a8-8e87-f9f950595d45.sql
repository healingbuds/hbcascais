-- Add order context columns to drgreen_orders for reliable admin sync
ALTER TABLE drgreen_orders 
  ADD COLUMN IF NOT EXISTS client_id text,
  ADD COLUMN IF NOT EXISTS shipping_address jsonb,
  ADD COLUMN IF NOT EXISTS customer_email text,
  ADD COLUMN IF NOT EXISTS customer_name text,
  ADD COLUMN IF NOT EXISTS country_code text,
  ADD COLUMN IF NOT EXISTS currency text DEFAULT 'EUR';

-- Add index for filtering by client
CREATE INDEX IF NOT EXISTS idx_drgreen_orders_client_id ON drgreen_orders(client_id);

-- Add comment for documentation
COMMENT ON COLUMN drgreen_orders.shipping_address IS 'Snapshot of shipping address at checkout time';