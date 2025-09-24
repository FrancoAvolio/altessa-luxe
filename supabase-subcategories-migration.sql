-- Migration to add subcategories support to the products system
-- Run this in your Supabase SQL Editor

-- Create subcategories table
CREATE TABLE IF NOT EXISTS subcategories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add unique constraint for category-subcategory name combinations
ALTER TABLE subcategories
ADD CONSTRAINT unique_category_subcategory
UNIQUE (category_id, name);

-- Add subcategory column to products table (if not exists)
-- Note: This uses TEXT instead of foreign key to keep it simple for your current setup
ALTER TABLE products
ADD COLUMN IF NOT EXISTS subcategory TEXT;

-- You can optionally add a subcategory_id column for future use:
-- ALTER TABLE products
-- ADD COLUMN IF NOT EXISTS subcategory_id INTEGER REFERENCES subcategories(id) ON DELETE SET NULL;

-- Optional: Create an index for better performance
CREATE INDEX IF NOT EXISTS idx_products_subcategory ON products(subcategory);
CREATE INDEX IF NOT EXISTS idx_subcategories_category_id ON subcategories(category_id);

-- Show success message
DO $$
BEGIN
  RAISE NOTICE '✅ Subcategories migration completed successfully!';
  RAISE NOTICE 'You can now create subcategories from the admin panel.';
END $$;
