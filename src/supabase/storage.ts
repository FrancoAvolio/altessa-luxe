// Supabase Storage utility
import { supabase } from './supabase';

export const storage = supabase.storage;

/**
 * Upload an image to Supabase storage
 * @param file The file to upload
 * @param bucketName The bucket name (defaults to 'products-images')
 * @param folder The folder path (optional)
 * @returns Promise with the public URL of the uploaded image
 */
export async function uploadImage(
  file: File,
  bucketName: string = 'products-images',
  folder: string = 'products'
): Promise<string | null> {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Upload error:', error);
      throw error;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
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
    if (url) urls.push(url);
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
