import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Read .env manually
const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const value = parts.slice(1).join('=').trim();
    env[key] = value;
  }
});

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const BRANCHES = [
  { name: 'Central Branch', location: 'Building A, Main Campus' },
  { name: 'North Annex', location: 'Building C, Engineering Quad' },
  { name: 'Science Library', location: 'Building F, Research Park' }
];

const CATEGORIES = [
  { name: 'Classics', description: 'Timeless literary masterpieces' },
  { name: 'Mystery', description: 'Suspenseful detective fiction and crime thrillers' },
  { name: 'Fiction', description: 'Contemporary prose and imaginative stories' },
  { name: 'Thriller', description: 'High-stakes suspense and psychological dramas' },
  { name: 'Non-fiction', description: 'Fact-based writings, history, and scientific discourse' }
];

const AUTHORS = [
  { name: 'Jane Austen', bio: 'An English novelist known primarily for her six major novels, which interpret, critique and comment upon the British landed gentry at the end of the 18th century.' },
  { name: 'Haruki Murakami', bio: 'A Japanese writer. His novels, essays, and short stories have been bestsellers in Japan as well as internationally, with his work translated into 50 languages.' },
  { name: 'Umberto Eco', bio: 'An Italian novelist, literary critic, philosopher, semiotician, and university professor. Best known for his historical mystery novel The Name of the Rose.' },
  { name: 'Alex Michaelides', bio: 'A Cypriot-British author and screenwriter. His debut novel, the psychological thriller The Silent Patient, was a New York Times bestseller.' },
  { name: 'Yuval Noah Harari', bio: 'An Israeli public intellectual, historian and a professor in the Department of History at the Hebrew University of Jerusalem.' },
  { name: 'F. Scott Fitzgerald', bio: 'An American novelist, essayist, screenwriter, and short story writer. He was best known for his novels depicting the flamboyance and excess of the Jazz Age.' },
  { name: 'Fyodor Dostoevsky', bio: 'A Russian novelist, short story writer, essayist, and journalist. His literary works explore human psychology in the troubled political, social, and spiritual atmospheres of 19th-century Russia.' }
];

const BOOKS = [
  {
    title: 'Pride and Prejudice',
    isbn: '9780141439518',
    description: 'A romantic novel of manners written by Jane Austen. The novel follows the character development of Elizabeth Bennet, who learns the error of making hasty judgments and comes to appreciate the difference between the superficial and the essential.',
    publisher: 'Penguin Classics',
    language: 'English',
    edition: 'Classic Edition',
    publication_year: 2003,
    cover_url: 'cover-1.jpg',
    author: 'Jane Austen',
    category: 'Classics'
  },
  {
    title: 'The Name of the Rose',
    isbn: '9780156001311',
    description: 'The year is 1327. Franciscans in a wealthy Italian abbey are suspected of heresy, and Brother William of Baskerville arrives to investigate. When his delicate mission is suddenly overshadowed by a series of bizarre deaths, William turns detective.',
    publisher: 'Harcourt',
    language: 'English',
    edition: 'Reprint Edition',
    publication_year: 1994,
    cover_url: 'cover-2.jpg',
    author: 'Umberto Eco',
    category: 'Mystery'
  },
  {
    title: 'Norwegian Wood',
    isbn: '9780375704079',
    description: 'Toru, a quiet and preternaturally serious young college student in Tokyo, is devoted to Naoko, a beautiful and introspective young woman, but their mutual passion is marked by the tragic death of their best friend years before.',
    publisher: 'Vintage International',
    language: 'English',
    edition: 'First Edition',
    publication_year: 2000,
    cover_url: 'cover-3.jpg',
    author: 'Haruki Murakami',
    category: 'Fiction'
  },
  {
    title: 'The Silent Patient',
    isbn: '9781250301697',
    description: 'Alicia Berenson’s life is seemingly perfect. A famous painter married to an in-demand fashion photographer, she lives in a grand house with big windows overlooking a park in one of London’s most desirable areas. One evening her husband Gabriel returns home late from a fashion shoot, and Alicia shoots him five times in the face, and then never speaks another word.',
    publisher: 'Celadon Books',
    language: 'English',
    edition: 'First Edition',
    publication_year: 2019,
    cover_url: 'cover-4.jpg',
    author: 'Alex Michaelides',
    category: 'Thriller'
  },
  {
    title: 'Sapiens: A Brief History of Humankind',
    isbn: '9780062316097',
    description: '100,000 years ago, at least six human species inhabited the earth. Today there is just one. Us. Homo sapiens. How did our species succeed in the battle for dominance? Why did our foraging ancestors come together to create cities and kingdoms? How did we come to believe in gods, nations and human rights?',
    publisher: 'Harper',
    language: 'English',
    edition: 'Illustrated Edition',
    publication_year: 2015,
    cover_url: 'cover-5.jpg',
    author: 'Yuval Noah Harari',
    category: 'Non-fiction'
  },
  {
    title: 'The Goldfinch',
    isbn: '9780316055437',
    description: 'A young New Yorker bemoans his mother’s death in a museum bombing and embarks on a haunting odyssey that takes him to Las Vegas, Amsterdam, and deep into the art underworld. Winner of the Pulitzer Prize for Fiction.',
    publisher: 'Little, Brown and Company',
    language: 'English',
    edition: 'First Edition',
    publication_year: 2013,
    cover_url: 'cover-6.jpg',
    author: 'Donna Tartt',
    category: 'Fiction'
  },
  {
    title: 'The Great Gatsby',
    isbn: '9780743273565',
    description: 'The story of the mysteriously wealthy Jay Gatsby and his love for the beautiful Daisy Buchanan. It is F. Scott Fitzgerald\'s magnum opus on the disillusionment of the American Dream during the Roaring Twenties.',
    publisher: 'Scribner',
    language: 'English',
    edition: 'Reprint Edition',
    publication_year: 2004,
    cover_url: 'cover-7.jpg',
    author: 'F. Scott Fitzgerald',
    category: 'Classics'
  },
  {
    title: 'Crime and Punishment',
    isbn: '9780140449136',
    description: 'Raskolnikov, a destitute and desperate former student, wanders through the slums of St Petersburg and commits a random murder without remorse or regret. He imagines himself to be a great man, a Napoleon: acting for a higher purpose beyond conventional moral law.',
    publisher: 'Penguin Classics',
    language: 'English',
    edition: 'Revised Edition',
    publication_year: 2003,
    cover_url: 'cover-8.jpg',
    author: 'Fyodor Dostoevsky',
    category: 'Classics'
  }
];

async function seed() {
  console.log('Starting seed operations...');

  try {
    // 1. Insert Branches
    console.log('Seeding branches...');
    const branchIds = {};
    for (const b of BRANCHES) {
      const { data, error } = await supabase
        .from('branches')
        .upsert(b, { onConflict: 'name' })
        .select();

      if (error) throw error;
      branchIds[data[0].name] = data[0].id;
    }
    console.log('Branches seeded successfully.');

    // 2. Insert Categories
    console.log('Seeding categories...');
    const categoryIds = {};
    for (const c of CATEGORIES) {
      const { data, error } = await supabase
        .from('categories')
        .upsert(c, { onConflict: 'name' })
        .select();

      if (error) throw error;
      categoryIds[data[0].name] = data[0].id;
    }
    console.log('Categories seeded successfully.');

    // 3. Insert Authors
    console.log('Seeding authors...');
    const authorIds = {};
    for (const a of AUTHORS) {
      const { data, error } = await supabase
        .from('authors')
        .upsert(a, { onConflict: 'name' })
        .select();

      if (error) throw error;
      authorIds[data[0].name] = data[0].id;
    }
    console.log('Authors seeded successfully.');

    // 4. Insert Books and map relations
    console.log('Seeding books...');
    for (const bookInfo of BOOKS) {
      const { author, category, ...bookFields } = bookInfo;
      const { data: bookData, error: bookError } = await supabase
        .from('books')
        .upsert(bookFields, { onConflict: 'isbn' })
        .select();

      if (bookError) throw bookError;
      const book = bookData[0];

      // Add Book Author relation
      const authorId = authorIds[author];
      if (authorId) {
        await supabase
          .from('book_authors')
          .upsert({ book_id: book.id, author_id: authorId }, { onConflict: 'book_id,author_id' });
      }

      // Add Book Category relation
      const categoryId = categoryIds[category];
      if (categoryId) {
        await supabase
          .from('book_categories')
          .upsert({ book_id: book.id, category_id: categoryId }, { onConflict: 'book_id,category_id' });
      }

      // Seed Book Copies distributed across the 3 branches
      console.log(`Seeding copies for "${book.title}"...`);
      let barcodeCounter = 1000 + Math.floor(Math.random() * 9000);
      const branchNames = Object.keys(branchIds);

      for (let i = 0; i < branchNames.length; i++) {
        const branchName = branchNames[i];
        const branchId = branchIds[branchName];
        const copyBarcode = `${book.isbn.substring(0, 8)}-${barcodeCounter + i}`;

        const copy = {
          book_id: book.id,
          branch_id: branchId,
          barcode: copyBarcode,
          shelf_location: `Aisle ${i + 1}, Shelf ${String.fromCharCode(65 + i)}${i * 3 + 2}`,
          condition: 'Good',
          status: 'available'
        };

        await supabase
          .from('book_copies')
          .upsert(copy, { onConflict: 'barcode' });
      }
    }

    console.log('Database seeded successfully!');
  } catch (err) {
    console.error('Seeding failed:', err);
  }
}

seed();

