import HomeClient from '@/components/HomeClient';
import { fetchCategoriesList, fetchProductsWithImages } from '@/lib/products';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [productsResult, categoriesResult] = await Promise.all([
    fetchProductsWithImages(),
    fetchCategoriesList(),
  ]);

  return (
    <HomeClient
      initialProducts={productsResult.items}
      initialCategories={categoriesResult.items}
      initialError={productsResult.error ?? categoriesResult.error}
    />
  );
}
