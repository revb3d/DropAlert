-- Make product_id nullable so category alerts (no product row) can be stored
ALTER TABLE alerts ALTER COLUMN product_id DROP NOT NULL;
