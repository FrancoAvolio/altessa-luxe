type TransformOpts = {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpg' | 'png' | 'avif';
  resize?: 'cover' | 'contain';
};

const DEFAULT_QUALITY = 72;
const MAX_DIMENSION = 2048;
const MIN_QUALITY = 45;
const NON_TRANSFORMABLE_EXTENSIONS = ['.svg', '.gif'];

function clampDimension(value?: number) {
  if (!value) return undefined;
  return Math.min(Math.max(1, Math.round(value)), MAX_DIMENSION);
}

function normalizeQuality(value?: number) {
  if (value == null) return DEFAULT_QUALITY;
  return Math.min(95, Math.max(MIN_QUALITY, Math.round(value)));
}

function shouldBypassTransform(pathname: string) {
  const lower = pathname.toLowerCase();
  return NON_TRANSFORMABLE_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

export function supabaseTransform(url: string, opts: TransformOpts = {}) {
  try {
    const u = new URL(url);
    const isSupabasePub = u.pathname.includes('/storage/v1/object/public/');
    if (!isSupabasePub) return url;
    if (shouldBypassTransform(u.pathname)) return url;

    const renderPath = u.pathname.replace(
      '/storage/v1/object/public/',
      '/storage/v1/render/image/public/'
    );
    const renderUrl = new URL(u.origin + renderPath);

    const width = clampDimension(opts.width);
    const height = clampDimension(opts.height);
    const quality = normalizeQuality(opts.quality);
    const format = opts.format;

    if (width) renderUrl.searchParams.set('width', String(width));
    if (height) renderUrl.searchParams.set('height', String(height));
    if (quality) renderUrl.searchParams.set('quality', String(quality));
    if (format) renderUrl.searchParams.set('format', format);
    if (opts.resize) renderUrl.searchParams.set('resize', opts.resize);

    return renderUrl.toString();
  } catch {
    return url;
  }
}

export const imgPresets = {
  card: (url: string) =>
    supabaseTransform(url, {
      width: 760,
      height: 760,
      quality: 68,
      resize: 'cover',
    }),
  thumb: (url: string) =>
    supabaseTransform(url, {
      width: 260,
      height: 260,
      quality: 60,
      resize: 'cover',
    }),
  mid: (url: string) =>
    supabaseTransform(url, {
      width: 1280,
      height: 1280,
      quality: 72,
      resize: 'contain',
    }),
  zoomHi: (url: string) =>
    supabaseTransform(url, {
      width: 1600,
      height: 1600,
      quality: 78,
      resize: 'contain',
    }),
};
