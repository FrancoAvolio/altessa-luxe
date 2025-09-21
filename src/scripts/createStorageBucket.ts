import { supabase } from '../supabase/supabase';

async function createBucket() {
  try {
    // First, try to create the bucket
    const { data, error } = await supabase.storage.createBucket('products-images', {
      public: true, // Make it public so images can be accessed
      allowedMimeTypes: ['image/jpg', 'image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      fileSizeLimit: 5242880, // 5MB limit
    });

    if (error) {
      // If bucket already exists, update its settings
      if (error.message.includes('Bucket already exists')) {
        console.log('✅ Bucket already exists!');

        // Update bucket to make sure it's public
        const { error: updateError } = await supabase.storage.updateBucket('products-images', {
          public: true,
          allowedMimeTypes: ['image/jpg', 'image/jpeg', 'image/png', 'image/gif', 'image/webp'],
          fileSizeLimit: 5242880,
        });

        if (updateError) {
          console.error('❌ Error updating bucket:', updateError.message);
        } else {
          console.log('✅ Bucket settings updated successfully!');
        }
      } else {
        console.error('❌ Error creating bucket:', error.message);
      }
    } else {
      console.log('✅ Bucket created successfully!', data);
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

createBucket();
