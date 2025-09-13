import { supabase } from '../supabase/supabase';

const sampleProducts = [
  {
    name: 'Reloj Deportivo',
    description: 'Reloj resistente al agua con GPS integrado.',
    price: 150.00,
    image_url: 'https://example.com/watch1.jpg'
  },
  {
    name: 'Reloj Clásico',
    description: 'Reloj elegante en acero inoxidable.',
    price: 200.00,
    image_url: 'https://example.com/watch2.jpg'
  },
  {
    name: 'Reloj Inteligente',
    description: 'Reloj con pantalla táctil y notificaciones.',
    price: 250.00,
    image_url: 'https://example.com/watch3.jpg'
  },
  {
    name: 'Reloj de Bolsillo',
    description: 'Reloj vintage de bolsillo con cadena.',
    price: 100.00,
    image_url: 'https://example.com/watch4.jpg'
  },
  {
    name: 'Reloj de Mujer',
    description: 'Reloj fino con correa de cuero.',
    price: 180.00,
    image_url: 'https://example.com/watch5.jpg'
  },
  {
    name: 'Reloj Militar',
    description: 'Reloj resistente con funciones militares.',
    price: 300.00,
    image_url: 'https://example.com/watch6.jpg'
  }
];

async function addSampleProducts() {
  try {
    const { data, error } = await supabase
      .from('products')
      .insert(sampleProducts);

    if (error) {
      console.error('Error inserting sample products:', error.message);
    } else {
      console.log('Sample products inserted successfully:', data);
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

addSampleProducts();
