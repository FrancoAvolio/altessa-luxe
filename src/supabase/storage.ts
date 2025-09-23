import { supabase } from './supabase';
import type { Options as ImageCompressionOptions } from 'browser-image-compression';

export const storage = supabase.storage;

const MAX_UPLOAD_MB = 50;
const MIME_EXTENSION: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/heic': 'heic',
  'image/heif': 'heif',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/ogg': 'ogv',
  'video/quicktime': 'mov',
};

let imageCompressionModule: (typeof import('browser-image-compression')) | null = null;

async function loadImageCompression() {
  if (typeof window === 'undefined') return null;
  if (imageCompressionModule) return imageCompressionModule;
  imageCompressionModule = await import('browser-image-compression');
  return imageCompressionModule;
}

function getExtensionFromFile(file: File): string {
  const fromMime = MIME_EXTENSION[file.type];
  if (fromMime) return fromMime;
  const parts = file.name.split('.');
  if (parts.length > 1) {
    return parts.pop() as string;
  }
  return 'dat';
}

async function maybeCompressImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) return file;
  try {
    const compressionModule = await loadImageCompression();
    if (!compressionModule) return file;
    const compressor = compressionModule.default ?? compressionModule;
    const options: ImageCompressionOptions = {
      maxSizeMB: 1.2,
      maxWidthOrHeight: 1600,
      initialQuality: 0.75,
      useWebWorker: true,
      fileType: 'image/webp',
    };
    const compressed = await compressor(file, options);
    const optimized =
      compressed instanceof File
        ? compressed
        : new File([compressed], file.name, { type: options.fileType ?? file.type });

    const normalized =
      options.fileType && optimized.type !== options.fileType
        ? new File([optimized], optimized.name, { type: options.fileType })
        : optimized;

    if (normalized.size >= file.size * 0.98) {
      return file;
    }

    return normalized;
  } catch (error) {
    console.warn('Image compression failed. Falling back to original file.', error);
    return file;
  }
}

function randomFileName(ext: string) {
  const token = Math.random().toString(36).slice(2, 10);
  return `${Date.now()}-${token}.${ext}`;
}

/**
 * Upload a media file (image or video) to Supabase Storage
 * Note: Large files may be rejected by Supabase depending on plan/limits.
 * Default soft-limit enforced here is 50MB to avoid silent failures.
 */
export async function uploadImage(
  file: File,
  bucketName: string = 'products-images',
  folder: string = 'products'
): Promise<string | null> {
  try {
    const maxBytes = MAX_UPLOAD_MB * 1024 * 1024;
    const prepared = await maybeCompressImage(file);

    if (prepared.size > maxBytes) {
      throw new Error(`El archivo "${file.name}" supera ${MAX_UPLOAD_MB}MB incluso tras optimizarlo.`);
    }

    const ext = getExtensionFromFile(prepared);
    const fileName = randomFileName(ext);
    const filePath = `${folder}/${fileName}`;

    const { error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, prepared, {
        cacheControl: '3600',
        upsert: false,
        contentType: prepared.type || undefined,
      });

    if (error) throw error;

    const {
      data: { publicUrl },
    } = supabase.storage.from(bucketName).getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error('Error uploading media:', error);
    return null;
  }
}

export async function uploadImages(
  files: File[],
  bucketName: string = 'products-images',
  folder: string = 'products'
): Promise<string[]> {
  const urls: string[] = [];
  for (const file of files) {
    const url = await uploadImage(file, bucketName, folder);
    if (!url) {
      throw new Error(`No se pudo subir "${file.name}". Verifica el tamano/limites.`);
    }
    urls.push(url);
  }
  return urls;
}

// Example usage:
// const imageUrl = await uploadImage(file);
// if (imageUrl) {
//   // Save imageUrl to your database
//   console.log('Image uploaded:', imageUrl);
// }

/**
 * Delete an image from Supabase storage
 * @param imageUrl The public URL of the image to delete
 * @param bucketName The bucket name (defaults to 'products-images')
 * @returns Promise with deletion result
 */
export async function deleteImage(
  imageUrl: string,
  bucketName: string = 'products-images'
): Promise<boolean> {
  try {
    if (!imageUrl) return true; // nothing to delete

    // Only attempt delete for Supabase public URLs
    const marker = `/storage/v1/object/public/${bucketName}/`;
    let filePath: string | null = null;

    if (imageUrl.includes(marker)) {
      // Extract everything after .../object/public/<bucket>/
      filePath = imageUrl.split(marker)[1] || null;
    } else if (imageUrl.includes('/storage/v1/object/public/')) {
      // Fallback: try to parse generic supabase public URL
      const generic = '/storage/v1/object/public/';
      const after = imageUrl.split(generic)[1];
      if (after) {
        const parts = after.split('/');
        const bucket = parts.shift();
        if (bucket === bucketName) filePath = parts.join('/');
      }
    }

    // Last resort: assume pattern .../folder/filename
    if (!filePath) {
      const urlParts = imageUrl.split('/');
      if (urlParts.length >= 2) {
        filePath = urlParts.slice(-2).join('/');
      }
    }

    if (!filePath) return false;

    const { error } = await supabase.storage
      .from(bucketName)
      .remove([filePath]);

    if (error) {
      console.error('Delete error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting image:', error);
    return false;
  }
}

export async function deleteImages(
  imageUrls: string[],
  bucketName: string = 'products-images'
): Promise<boolean> {
  let ok = true;
  for (const url of imageUrls) {
    const res = await deleteImage(url, bucketName);
    if (!res) ok = false;
  }
  return ok;
}

