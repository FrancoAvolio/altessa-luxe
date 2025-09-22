// app/page.tsx
import HomeClient from '@/components/HomeClient';
import { fetchProductsWithImages } from '@/lib/products';
import { fetchCategoryRows } from '@/lib/categories';

export const revalidate = 120;

export default async function HomePage() {
  const [productsResult, categoriesResult] = await Promise.all([
    fetchProductsWithImages(),
    fetchCategoryRows(),
  ]);

  return (
    <HomeClient
      initialProducts={productsResult.items}
      initialCategoryRows={categoriesResult.items}
      initialError={productsResult.error ?? categoriesResult.error}
    />
  );
}
