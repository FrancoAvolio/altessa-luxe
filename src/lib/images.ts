type TransformOpts = {
  width?: number;
  height?: number;
  quality?: number;
  format?: "webp" | "jpg" | "png" | "avif";
  resize?: "cover" | "contain";
};

export function supabaseTransform(url: string, opts: TransformOpts = {}) {
  try {
    const u = new URL(url);
    const isSupabasePub = u.pathname.includes("/storage/v1/object/public/");
    if (!isSupabasePub) return url;

    const renderPath = u.pathname.replace(
      "/storage/v1/object/public/",
      "/storage/v1/render/image/public/"
    );
    const renderUrl = new URL(u.origin + renderPath);

    if (opts.width) renderUrl.searchParams.set("width", String(opts.width));
    if (opts.height) renderUrl.searchParams.set("height", String(opts.height));
    if (opts.quality)
      renderUrl.searchParams.set("quality", String(opts.quality));
    if (opts.format) renderUrl.searchParams.set("format", opts.format);
    if (opts.resize) renderUrl.searchParams.set("resize", opts.resize);

    return renderUrl.toString();
  } catch {
    return url;
  }
}

export const imgPresets = {
  card: (url: string) =>
    supabaseTransform(url, {
      width: 800,
      height: 800,
      quality: 70,
      resize: "cover",
    }),
  thumb: (url: string) =>
    supabaseTransform(url, {
      width: 300,
      height: 300,
      quality: 65,
      resize: "cover",
    }),
  mid: (url: string) =>
    supabaseTransform(url, {
      width: 1200,
      height: 1200,
      quality: 72,
      resize: "contain",
    }),
  zoomHi: (url: string) =>
    supabaseTransform(url, {
      width: 2000,
      height: 2000,
      quality: 80,
      resize: "contain",
    }),
};
