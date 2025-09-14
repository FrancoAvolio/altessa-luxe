// Supabase Storage utility
import { supabase } from './supabase';

export const storage = supabase.storage;

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
    // quick client-side size guard (50MB)
    const MAX_MB = 50;
    const maxBytes = MAX_MB * 1024 * 1024;
    if (file.size > maxBytes) {
      throw new Error(`El archivo "${file.name}" supera ${MAX_MB}MB.`);
    }
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) throw error;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

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
      throw new Error(`No se pudo subir "${file.name}". Verifica el tamaño/límites.`);
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
