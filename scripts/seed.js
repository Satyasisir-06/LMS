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
  { name: 'Non-fiction', description: 'Fact-based writings, history, and scientific discourse' },
  { name: 'Philosophy', description: 'Fundamental investigations into existence, ethics, and reason' },
  { name: 'Gothic Fiction', description: 'Dark romanticism, mystery, and eerie atmospheres' },
  { name: 'Science', description: 'Foundational scientific treatises and empirical studies' },
  { name: 'Dystopian', description: 'Speculative political fiction and societal critiques' },
  { name: 'Epic Literature', description: 'Monumental narratives of epic voyages and human struggle' }
];

const AUTHORS = [
  { name: 'Jane Austen', bio: 'English novelist known for her six major novels interpreting the British landed gentry at the end of the 18th century.' },
  { name: 'Haruki Murakami', bio: 'Japanese author whose surreal novels and short stories have been translated into over 50 languages.' },
  { name: 'Umberto Eco', bio: 'Italian semiotician, philosopher, and novelist famous for The Name of the Rose.' },
  { name: 'Alex Michaelides', bio: 'Cypriot-British author best known for the psychological thriller The Silent Patient.' },
  { name: 'Yuval Noah Harari', bio: 'Public intellectual, historian, and professor at the Hebrew University of Jerusalem.' },
  { name: 'F. Scott Fitzgerald', bio: 'American novelist depicting the Jazz Age in iconic works like The Great Gatsby.' },
  { name: 'Fyodor Dostoevsky', bio: 'Russian novelist whose psychological works explore human spirituality and anguish.' },
  { name: 'Mary Shelley', bio: 'English novelist who created the landmark Gothic masterwork Frankenstein.' },
  { name: 'Herman Melville', bio: 'American novelist and poet of the American Renaissance, author of Moby-Dick.' },
  { name: 'George Orwell', bio: 'English novelist, essayist, and critic famous for Animal Farm and 1984.' },
  { name: 'Sun Tzu', bio: 'Ancient Chinese general, military strategist, and philosopher attributed with The Art of War.' },
  { name: 'Marcus Aurelius', bio: 'Roman Emperor and Stoic philosopher who authored Meditations.' },
  { name: 'Franz Kafka', bio: 'Prague-born German-language writer renowned for Kafkaesque existentialist works.' },
  { name: 'Plato', bio: 'Classical Greek philosopher founder of the Academy in Athens, student of Socrates.' },
  { name: 'Bram Stoker', bio: 'Irish author best remembered today for his 1897 Gothic novel Dracula.' },
  { name: 'Charles Darwin', bio: 'English naturalist who established evolutionary theory in On the Origin of Species.' },
  { name: 'Oscar Wilde', bio: 'Irish poet and playwright author of The Picture of Dorian Gray.' },
  { name: 'Henry David Thoreau', bio: 'American naturalist, essayist, and philosopher known for Walden.' },
  { name: 'Confucius', bio: 'Chinese philosopher whose teachings formed the basis of East Asian moral philosophy.' }
];

const BOOKS = [
  {
    title: 'Pride and Prejudice',
    isbn: '9780141439518',
    description: 'A romantic novel of manners written by Jane Austen. The novel follows the character development of Elizabeth Bennet, who learns the error of making hasty judgments.',
    publisher: 'Penguin Classics',
    language: 'English',
    edition: 'Classic Edition',
    publication_year: 1813,
    cover_url: '/cover-7.webp',
    author: 'Jane Austen',
    category: 'Classics'
  },
  {
    title: 'The Name of the Rose',
    isbn: '9780156001311',
    description: 'The year is 1327. Franciscans in a wealthy Italian abbey are suspected of heresy, and Brother William of Baskerville arrives to investigate a series of bizarre deaths.',
    publisher: 'Harcourt',
    language: 'English',
    edition: 'Reprint Edition',
    publication_year: 1980,
    cover_url: '/cover-2.webp',
    author: 'Umberto Eco',
    category: 'Mystery'
  },
  {
    title: 'Norwegian Wood',
    isbn: '9780375704079',
    description: 'Toru, a quiet college student in Tokyo, is devoted to Naoko, a beautiful young woman, but their passion is marked by the tragic death of their best friend.',
    publisher: 'Vintage International',
    language: 'English',
    edition: 'First Edition',
    publication_year: 1987,
    cover_url: '/cover-3.webp',
    author: 'Haruki Murakami',
    category: 'Fiction'
  },
  {
    title: 'The Silent Patient',
    isbn: '9781250301697',
    description: 'Alicia Berenson’s life is seemingly perfect. One evening her husband returns late from a photoshoot, and Alicia shoots him five times in the face, never speaking another word.',
    publisher: 'Celadon Books',
    language: 'English',
    edition: 'First Edition',
    publication_year: 2019,
    cover_url: '/cover-4.webp',
    author: 'Alex Michaelides',
    category: 'Thriller'
  },
  {
    title: 'Sapiens: A Brief History of Humankind',
    isbn: '9780062316097',
    description: '100,000 years ago, at least six human species inhabited the earth. Today there is just one: Homo sapiens. How did our species succeed in the battle for dominance?',
    publisher: 'Harper',
    language: 'English',
    edition: 'Illustrated Edition',
    publication_year: 2015,
    cover_url: '/cover-5.webp',
    author: 'Yuval Noah Harari',
    category: 'Non-fiction'
  },
  {
    title: 'The Goldfinch',
    isbn: '9780316055437',
    description: 'A young New Yorker bemoans his mother’s death in a museum bombing and embarks on a haunting odyssey into the art underworld. Winner of the Pulitzer Prize.',
    publisher: 'Little, Brown and Company',
    language: 'English',
    edition: 'First Edition',
    publication_year: 2013,
    cover_url: '/cover-6.webp',
    author: 'Donna Tartt',
    category: 'Fiction'
  },
  {
    title: 'The Great Gatsby',
    isbn: '9780743273565',
    description: 'The story of the mysteriously wealthy Jay Gatsby and his passion for Daisy Buchanan. F. Scott Fitzgerald’s magnum opus on the American Dream.',
    publisher: 'Scribner',
    language: 'English',
    edition: 'Reprint Edition',
    publication_year: 1925,
    cover_url: '/cover-1.webp',
    author: 'F. Scott Fitzgerald',
    category: 'Classics'
  },
  {
    title: 'Crime and Punishment',
    isbn: '9780140449136',
    description: 'Raskolnikov, a destitute former student, wanders through St. Petersburg and commits a murder. He imagines himself to be a Napoleon acting beyond moral law.',
    publisher: 'Penguin Classics',
    language: 'English',
    edition: 'Revised Edition',
    publication_year: 1866,
    cover_url: '/cover-8.webp',
    author: 'Fyodor Dostoevsky',
    category: 'Classics'
  },
  {
    title: 'Frankenstein; or, The Modern Prometheus',
    isbn: '9780141439471',
    description: 'Victor Frankenstein succeeds in giving life to his own creature, only to recoil in horror from its grotesque appearance, igniting a tragic cycle of vengeance.',
    publisher: 'Penguin Classics',
    language: 'English',
    edition: '1818 Text Edition',
    publication_year: 1818,
    cover_url: '/cover-1.webp',
    author: 'Mary Shelley',
    category: 'Gothic Fiction'
  },
  {
    title: 'Moby-Dick; or, The Whale',
    isbn: '9780142437247',
    description: 'Ishmael narrates the monomaniacal quest of Captain Ahab, commander of the Pequod, to destroy the giant white sperm whale Moby Dick.',
    publisher: 'Penguin Classics',
    language: 'English',
    edition: 'Centennial Edition',
    publication_year: 1851,
    cover_url: '/cover-2.webp',
    author: 'Herman Melville',
    category: 'Epic Literature'
  },
  {
    title: 'Nineteen Eighty-Four (1984)',
    isbn: '9780451524935',
    description: 'In a totalitarian future world governed by Big Brother, Winston Smith attempts a private rebellion against the Thought Police and omnipresent state control.',
    publisher: 'Signet Classics',
    language: 'English',
    edition: '60th Anniversary Edition',
    publication_year: 1949,
    cover_url: '/cover-3.webp',
    author: 'George Orwell',
    category: 'Dystopian'
  },
  {
    title: 'The Art of War',
    isbn: '9781590302255',
    description: 'The definitive ancient Chinese treatise on military strategy, tactical maneuverability, espionage, and conflict resolution by Master Sun.',
    publisher: 'Shambhala',
    language: 'English',
    edition: 'Translation Edition',
    publication_year: -475,
    cover_url: '/cover-4.webp',
    author: 'Sun Tzu',
    category: 'Philosophy'
  },
  {
    title: 'Meditations',
    isbn: '9780812968255',
    description: 'Private spiritual reflections and Stoic exercises recorded by Roman Emperor Marcus Aurelius on self-discipline, mortality, and rational duty.',
    publisher: 'Modern Library',
    language: 'English',
    edition: 'Hays Translation',
    publication_year: 180,
    cover_url: '/cover-5.webp',
    author: 'Marcus Aurelius',
    category: 'Philosophy'
  },
  {
    title: 'The Metamorphosis',
    isbn: '9780553213690',
    description: 'Traveling salesman Gregor Samsa wakes up one morning to find himself transformed into a monstrous insect, examining alienation and familial guilt.',
    publisher: 'Bantam Classics',
    language: 'English',
    edition: 'Classic Edition',
    publication_year: 1915,
    cover_url: '/cover-6.webp',
    author: 'Franz Kafka',
    category: 'Classics'
  },
  {
    title: 'The Republic',
    isbn: '9780140455113',
    description: 'Plato’s classic Socratic dialogue on the nature of justice, the ideal city-state, the philosopher-king, and the famous Allegory of the Cave.',
    publisher: 'Penguin Classics',
    language: 'English',
    edition: 'Desmond Lee Translation',
    publication_year: -375,
    cover_url: '/cover-7.webp',
    author: 'Plato',
    category: 'Philosophy'
  },
  {
    title: 'Dracula',
    isbn: '9780141439846',
    description: 'Count Dracula attempts to relocate from Transylvania to Victorian London to spread his vampire curse, confronted by Van Helsing and Jonathan Harker.',
    publisher: 'Penguin Classics',
    language: 'English',
    edition: 'Definitive Edition',
    publication_year: 1897,
    cover_url: '/cover-8.webp',
    author: 'Bram Stoker',
    category: 'Gothic Fiction'
  },
  {
    title: 'On the Origin of Species',
    isbn: '9780140432053',
    description: 'Charles Darwin’s foundational work introducing the theory of natural selection and evolutionary biology that reshaped modern science.',
    publisher: 'Penguin Classics',
    language: 'English',
    edition: 'First Edition Reprint',
    publication_year: 1859,
    cover_url: '/cover-1.webp',
    author: 'Charles Darwin',
    category: 'Science'
  },
  {
    title: 'The Picture of Dorian Gray',
    isbn: '9780141439570',
    description: 'Dorian Gray trades his soul for eternal youth while his oil portrait ages and reflects every sin and moral decay he commits in secret.',
    publisher: 'Penguin Classics',
    language: 'English',
    edition: 'Uncensored Edition',
    publication_year: 1890,
    cover_url: '/cover-2.webp',
    author: 'Oscar Wilde',
    category: 'Classics'
  },
  {
    title: 'Walden; or, Life in the Woods',
    isbn: '9780140390445',
    description: 'Thoreau’s classic account of living in a self-built cabin by Walden Pond, celebrating self-reliance, nature, and philosophical contemplation.',
    publisher: 'Penguin Classics',
    language: 'English',
    edition: 'Annotated Edition',
    publication_year: 1854,
    cover_url: '/cover-3.webp',
    author: 'Henry David Thoreau',
    category: 'Non-fiction'
  },
  {
    title: 'The Analects of Confucius',
    isbn: '9780140443868',
    description: 'The core collection of sayings, ethical ideas, and aphorisms attributed to Confucius, serving as the cornerstone of East Asian moral philosophy.',
    publisher: 'Penguin Classics',
    language: 'English',
    edition: 'Lau Translation',
    publication_year: -475,
    cover_url: '/cover-4.webp',
    author: 'Confucius',
    category: 'Philosophy'
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

    console.log('Database seeded successfully with 20 classic titles!');
  } catch (err) {
    console.error('Seeding failed:', err);
  }
}

seed();
