-- SQL script para crear la tabla de productos en Supabase
CREATE TABLE IF NOT EXISTS products (
  id serial PRIMARY KEY,
  name text NOT NULL,
  description text,
  price numeric,
  image_url text,
  -- Nueva columna opcional para categorías simples
  category text
);
