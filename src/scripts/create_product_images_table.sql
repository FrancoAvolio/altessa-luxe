-- Crear tabla de imágenes asociadas a productos
create table if not exists public.product_images (
  id bigserial primary key,
  product_id integer not null references public.products(id) on delete cascade,
  url text not null,
  position integer default 0,
  created_at timestamp with time zone default now()
);

-- Índices útiles
create index if not exists product_images_product_id_idx on public.product_images(product_id);
create index if not exists product_images_position_idx on public.product_images(product_id, position);

-- RLS: lectura pública; mutaciones solo admin
alter table public.product_images enable row level security;

-- Limpieza idempotente
drop policy if exists "Public read product_images" on public.product_images;
drop policy if exists "Admin insert product_images" on public.product_images;
drop policy if exists "Admin update product_images" on public.product_images;
drop policy if exists "Admin delete product_images" on public.product_images;

-- Lectura pública
create policy "Public read product_images" on public.product_images
for select using (true);

-- Insert solo admin
create policy "Admin insert product_images" on public.product_images
for insert with check (
  coalesce((auth.jwt() -> 'user_metadata' ->> 'role'), '') = 'admin'
  or coalesce((auth.jwt() ->> 'email'), '') = 'admin@relojes.com'
);

-- Update solo admin
create policy "Admin update product_images" on public.product_images
for update using (
  coalesce((auth.jwt() -> 'user_metadata' ->> 'role'), '') = 'admin'
  or coalesce((auth.jwt() ->> 'email'), '') = 'admin@relojes.com'
) with check (
  coalesce((auth.jwt() -> 'user_metadata' ->> 'role'), '') = 'admin'
  or coalesce((auth.jwt() ->> 'email'), '') = 'admin@relojes.com'
);

-- Delete solo admin
create policy "Admin delete product_images" on public.product_images
for delete using (
  coalesce((auth.jwt() -> 'user_metadata' ->> 'role'), '') = 'admin'
  or coalesce((auth.jwt() ->> 'email'), '') = 'admin@relojes.com'
);

