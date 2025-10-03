-- Fix null plan_types by setting them to 'free'
UPDATE users SET plan_type = 'free' WHERE plan_type IS NULL;

-- Add default constraint to prevent future null values
ALTER TABLE users ALTER COLUMN plan_type SET DEFAULT 'free';