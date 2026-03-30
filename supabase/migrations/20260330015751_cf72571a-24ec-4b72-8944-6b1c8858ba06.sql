UPDATE public.drgreen_orders 
SET status = 'CANCELLED', 
    payment_status = 'CANCELLED', 
    sync_status = 'failed', 
    sync_error = 'Legacy local fallback order — cancelled during cleanup',
    updated_at = now()
WHERE drgreen_order_id LIKE 'LOCAL-%';