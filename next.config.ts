import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Permitir imágenes remotas desde Supabase Storage y otros dominios usados
    remotePatterns: [
      // Tu proyecto Supabase (ajusta si cambias de proyecto)
      {
        protocol: "https",
        hostname: "ixvywnbwibliayfeudsk.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      // Patrón genérico por si usas otro proyecto Supabase en el futuro
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      // Ejemplos/demos u otras URLs que puedas pegar
      {
        protocol: "https",
        hostname: "example.com",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "ixvywnbwibliayfeudsk.supabase.co",
        pathname: "/storage/v1/render/image/public/**",
      },
    ],
  },
};

export default nextConfig;
