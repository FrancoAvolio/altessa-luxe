This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Notas del proyecto: Productos con categorías

Este proyecto usa Supabase para persistir productos e imágenes. Se agregó soporte de categorías simples:

- Nueva columna `category` en la tabla `products`.
- Filtro lateral de categorías en `src/app/page.tsx` que se genera dinámicamente a partir de los productos existentes.
- El formulario de administración permite asignar una categoría escribiendo una nueva o eligiendo una existente (autocompletado con datalist).

SQL a aplicar en Supabase:

- `src/scripts/add_category_to_products.sql`: agrega la columna `category` a `products` y un índice (si ya existía la tabla).
- `src/scripts/create_categories_table.sql`: crea la tabla `categories` con RLS. El admin puede crear/editar/borrar; lectura pública.

UI Admin:

- Botón “Agregar Categoría” abre un modal simple (`src/components/CategoryForm.tsx`).
- Al crear/editar un producto, el campo “Categoría” muestra un `<select>` con las categorías existentes. Si no hay, permite escribir.
