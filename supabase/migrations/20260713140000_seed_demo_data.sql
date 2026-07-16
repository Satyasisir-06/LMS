-- ============================================================================
--  Athenaeum — Demo Seed Data RPC (Phase 2 Helper)
-- ============================================================================
--  One-click demo data for librarians/admins. Inserts branches, categories,
--  authors, books, and physical copies so circulation can be exercised
--  end-to-end. Idempotent: exits early if books already exist.
--  Trigger from the UI ("Load demo data") or call directly in the SQL editor:
--
--      select public.seed_demo_data();
-- ============================================================================

create or replace function public.seed_demo_data()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  -- Branches
  br_main  uuid;
  br_sci   uuid;
  -- Categories
  c_fic    uuid;
  c_sci    uuid;
  c_hist   uuid;
  c_phil   uuid;
  c_poet   uuid;
  c_art    uuid;
  c_tech   uuid;
  -- Authors
  a_austen uuid;
  a_orwell uuid;
  a_asimov uuid;
  a_sagan  uuid;
  a_tolkien uuid;
  a_camus  uuid;
  a_plato  uuid;
  a_dickinson uuid;
  a_hawking uuid;
  a_gibran uuid;
  a_shakespeare uuid;
  a_feynman uuid;
  -- Books
  b_pp     uuid;
  b_1984   uuid;
  b_found  uuid;
  b_cosmos uuid;
  b_hobbit uuid;
  b_stranger uuid;
  b_republic uuid;
  b_poems  uuid;
  b_brief  uuid;
  b_prophet uuid;
  b_hamlet uuid;
  b_qm     uuid;
  cover    text := 'https://covers.openlibrary.org/b/isbn/';
begin
  if not public.is_staff() then
    raise exception 'Only staff may seed demo data.';
  end if;

  -- Guard against duplicate seeding.
  if exists (select 1 from public.books limit 1) then
    return;
  end if;

  -- ── Branches ──────────────────────────────────────────────────────────────
  insert into public.branches (name, location)
    values ('Main Library', 'Central Campus'),
           ('Science Wing', 'North Quad')
  on conflict (name) do nothing;

  select id into br_main from public.branches where name = 'Main Library';
  select id into br_sci  from public.branches where name = 'Science Wing';

  -- ── Categories ────────────────────────────────────────────────────────────
  insert into public.categories (name, description) values
    ('Fiction', 'Literary and popular narrative fiction'),
    ('Science', 'Natural and physical sciences'),
    ('History', 'Historical accounts and biography'),
    ('Philosophy', 'Foundational and modern philosophical thought'),
    ('Poetry', 'Verse, lyric, and collected poems'),
    ('Art', 'Visual arts, design, and criticism'),
    ('Technology', 'Computing, engineering, and applied tech')
  on conflict (name) do nothing;

  select id into c_fic  from public.categories where name = 'Fiction';
  select id into c_sci  from public.categories where name = 'Science';
  select id into c_hist from public.categories where name = 'History';
  select id into c_phil from public.categories where name = 'Philosophy';
  select id into c_poet from public.categories where name = 'Poetry';
  select id into c_art  from public.categories where name = 'Art';
  select id into c_tech from public.categories where name = 'Technology';

  -- ── Authors ───────────────────────────────────────────────────────────────
  insert into public.authors (name, bio) values
    ('Jane Austen', 'English novelist known for social commentary and wit.'),
    ('George Orwell', 'Essayist and novelist of dystopian political fiction.'),
    ('Isaac Asimov', 'Biochemist and prolific writer of science and science fiction.'),
    ('Carl Sagan', 'Astronomer and science communicator.'),
    ('J.R.R. Tolkien', 'Philologist and author of high fantasy.'),
    ('Albert Camus', 'French-Algerian philosopher and novelist of the absurd.'),
    ('Plato', 'Classical Greek philosopher of the Academy.'),
    ('Emily Dickinson', 'American poet of compact, oblique verse.'),
    ('Stephen Hawking', 'Theoretical physicist and cosmologist.'),
    ('Kahlil Gibran', 'Lebanese-American poet and visual artist.'),
    ('William Shakespeare', 'English playwright and poet.'),
    ('Richard Feynman', 'Theoretical physicist and gifted teacher.')
  on conflict (name) do nothing;

  select id into a_austen from public.authors where name = 'Jane Austen';
  select id into a_orwell from public.authors where name = 'George Orwell';
  select id into a_asimov from public.authors where name = 'Isaac Asimov';
  select id into a_sagan  from public.authors where name = 'Carl Sagan';
  select id into a_tolkien from public.authors where name = 'J.R.R. Tolkien';
  select id into a_camus  from public.authors where name = 'Albert Camus';
  select id into a_plato  from public.authors where name = 'Plato';
  select id into a_dickinson from public.authors where name = 'Emily Dickinson';
  select id into a_hawking from public.authors where name = 'Stephen Hawking';
  select id into a_gibran from public.authors where name = 'Kahlil Gibran';
  select id into a_shakespeare from public.authors where name = 'William Shakespeare';
  select id into a_feynman from public.authors where name = 'Richard Feynman';

  -- ── Books ─────────────────────────────────────────────────────────────────
  insert into public.books (title, isbn, description, publisher, language, edition, publication_year, cover_url)
    values ('Pride and Prejudice', '9780141439518', 'A witty romance of manners in Georgian England.', 'Penguin Classics', 'English', 'Reprint', 1813, cover || '9780141439518-L.jpg')
    returning id into b_pp;

  insert into public.books (title, isbn, description, publisher, language, edition, publication_year, cover_url)
    values ('1984', '9780451524935', 'A dystopian novel of surveillance and totalitarianism.', 'Signet Classics', 'English', 'Reprint', 1949, cover || '9780451524935-L.jpg')
    returning id into b_1984;

  insert into public.books (title, isbn, description, publisher, language, edition, publication_year, cover_url)
    values ('Foundation', '9780553293353', 'The fall and rise of a galactic empire across millennia.', 'Bantam Spectra', 'English', 'Reprint', 1951, cover || '9780553293353-L.jpg')
    returning id into b_found;

  insert into public.books (title, isbn, description, publisher, language, edition, publication_year, cover_url)
    values ('Cosmos', '9780345331359', 'A sweeping tour of the universe and our place within it.', 'Ballantine Books', 'English', 'Reprint', 1980, cover || '9780345331359-L.jpg')
    returning id into b_cosmos;

  insert into public.books (title, isbn, description, publisher, language, edition, publication_year, cover_url)
    values ('The Hobbit', '9780547928227', 'A reluctant hero and a quest for a dragon''s hoard.', 'Houghton Mifflin', 'English', '75th Anniv.', 1937, cover || '9780547928227-L.jpg')
    returning id into b_hobbit;

  insert into public.books (title, isbn, description, publisher, language, edition, publication_year, cover_url)
    values ('The Stranger', '9780679720201', 'An emotionally detached man confronts the absurd.', 'Vintage', 'English', 'Reprint', 1942, cover || '9780679720201-L.jpg')
    returning id into b_stranger;

  insert into public.books (title, isbn, description, publisher, language, edition, publication_year, cover_url)
    values ('The Republic', '9780872201361', 'Plato''s dialogue on justice, the soul, and the ideal city.', 'Hackett', 'English', 'Translation', -380, cover || '9780872201361-L.jpg')
    returning id into b_republic;

  insert into public.books (title, isbn, description, publisher, language, edition, publication_year, cover_url)
    values ('Selected Poems', '9780486299897', 'A gathering of Emily Dickinson''s singular verse.', 'Dover', 'English', 'Reprint', 1890, cover || '9780486299897-L.jpg')
    returning id into b_poems;

  insert into public.books (title, isbn, description, publisher, language, edition, publication_year, cover_url)
    values ('A Brief History of Time', '9780553380163', 'From the Big Bang to black holes, for general readers.', 'Bantam', 'English', 'Reprint', 1988, cover || '9780553380163-L.jpg')
    returning id into b_brief;

  insert into public.books (title, isbn, description, publisher, language, edition, publication_year, cover_url)
    values ('The Prophet', '9780805210606', 'Twenty-six poetic essays on life and the human condition.', 'Knopf', 'English', 'Reprint', 1923, cover || '9780805210606-L.jpg')
    returning id into b_prophet;

  insert into public.books (title, isbn, description, publisher, language, edition, publication_year, cover_url)
    values ('Hamlet', '9780743477123', 'The tragedy of the Prince of Denmark.', 'Folger', 'English', 'Reprint', 1603, cover || '9780743477123-L.jpg')
    returning id into b_hamlet;

  insert into public.books (title, isbn, description, publisher, language, edition, publication_year, cover_url)
    values ('QED: The Strange Theory of Light and Matter', '9780691125756', 'Feynman''s lucid account of quantum electrodynamics.', 'Princeton', 'English', 'Reprint', 1985, cover || '9780691125756-L.jpg')
    returning id into b_qm;

  -- ── Book ↔ Author links ───────────────────────────────────────────────────
  insert into public.book_authors (book_id, author_id) values
    (b_pp, a_austen), (b_1984, a_orwell), (b_found, a_asimov),
    (b_cosmos, a_sagan), (b_hobbit, a_tolkien), (b_stranger, a_camus),
    (b_republic, a_plato), (b_poems, a_dickinson), (b_brief, a_hawking),
    (b_prophet, a_gibran), (b_hamlet, a_shakespeare), (b_qm, a_feynman);

  -- ── Book ↔ Category links ─────────────────────────────────────────────────
  insert into public.book_categories (book_id, category_id) values
    (b_pp, c_fic), (b_1984, c_fic), (b_1984, c_phil),
    (b_found, c_sci), (b_found, c_fic), (b_cosmos, c_sci),
    (b_hobbit, c_fic), (b_hobbit, c_art), (b_stranger, c_fic),
    (b_stranger, c_phil), (b_republic, c_phil), (b_republic, c_hist),
    (b_poems, c_poet), (b_brief, c_sci), (b_brief, c_tech),
    (b_prophet, c_poet), (b_prophet, c_phil), (b_hamlet, c_fic),
    (b_hamlet, c_poet), (b_qm, c_sci), (b_qm, c_tech);

  -- ── Book copies (barcodes, branches, shelves) ─────────────────────────────
  insert into public.book_copies (book_id, branch_id, barcode, shelf_location, condition, status) values
    (b_pp, br_main, 'ATH-0001', 'FIC-A12', 'Good', 'available'),
    (b_pp, br_sci,  'ATH-0002', 'FIC-S04', 'Good', 'available'),
    (b_1984, br_main, 'ATH-0003', 'FIC-A13', 'Good', 'available'),
    (b_1984, br_sci,  'ATH-0004', 'FIC-S05', 'Worn', 'available'),
    (b_found, br_main, 'ATH-0005', 'SCI-A02', 'Good', 'available'),
    (b_cosmos, br_sci, 'ATH-0006', 'SCI-S01', 'Good', 'available'),
    (b_hobbit, br_main, 'ATH-0007', 'FIC-A14', 'Good', 'available'),
    (b_hobbit, br_sci,  'ATH-0008', 'FIC-S06', 'Good', 'available'),
    (b_stranger, br_main, 'ATH-0009', 'FIC-A15', 'Good', 'available'),
    (b_republic, br_main, 'ATH-0010', 'PHI-A01', 'Good', 'available'),
    (b_poems, br_sci, 'ATH-0011', 'POE-S01', 'Good', 'available'),
    (b_brief, br_sci, 'ATH-0012', 'SCI-S02', 'Good', 'available'),
    (b_prophet, br_main, 'ATH-0013', 'POE-A01', 'Good', 'available'),
    (b_hamlet, br_main, 'ATH-0014', 'FIC-A16', 'Good', 'available'),
    (b_hamlet, br_sci,  'ATH-0015', 'FIC-S07', 'Worn', 'available'),
    (b_qm, br_sci, 'ATH-0016', 'SCI-S03', 'Good', 'available');
end;
$$;
