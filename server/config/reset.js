import { pool } from './database.js'

const schema = `
  DROP TABLE IF EXISTS event_images, event_tags, events, tags, activity_types, venues, users CASCADE;

  CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  );

  CREATE TABLE venues (
    id SERIAL PRIMARY KEY,
    owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    latitude NUMERIC,
    longitude NUMERIC,
    website_url TEXT,
    hours TEXT
  );

  CREATE TABLE activity_types (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
  );

  CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    venue_id INTEGER NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    activity_type_id INTEGER NOT NULL REFERENCES activity_types(id),
    title TEXT NOT NULL,
    description TEXT,
    what_to_bring TEXT,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    price NUMERIC NOT NULL DEFAULT 0 CHECK (price >= 0)
  );

  CREATE TABLE tags (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
  );

  CREATE TABLE event_tags (
    event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
    tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (event_id, tag_id)
  );

  CREATE TABLE event_images (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    position INTEGER NOT NULL DEFAULT 0
  );
`

// Seed owners can't log in yet; real password hashes come with the auth issue
const seed = `
  INSERT INTO users (name, email, password_hash) VALUES
    ('Maya Lin', 'maya@clayandcoffee.com', 'seed-no-login'),
    ('Jordan Reyes', 'jordan@pageturner.com', 'seed-no-login'),
    ('Sam Okafor', 'sam@fiberloft.com', 'seed-no-login');

  INSERT INTO venues (owner_id, name, address, city, latitude, longitude, website_url, hours) VALUES
    (1, 'Clay & Coffee Studio', '412 Valencia St', 'San Francisco', 37.7652, -122.4219, 'https://example.com/clay-and-coffee', 'Tue–Sun 10am–8pm'),
    (2, 'Page Turner Books', '1830 Telegraph Ave', 'Oakland', 37.8085, -122.2700, 'https://example.com/page-turner', 'Daily 9am–9pm'),
    (3, 'The Fiber Loft', '77 Main St', 'Berkeley', 37.8716, -122.2727, 'https://example.com/fiber-loft', 'Wed–Sat 11am–6pm'),
    (1, 'Ink & Easel Supply Co.', '255 Divisadero St', 'San Francisco', 37.7721, -122.4374, 'https://example.com/ink-and-easel', 'Mon–Sat 10am–7pm');

  INSERT INTO activity_types (name) VALUES ('Workshop'), ('Class'), ('Open Mic'), ('Market'), ('Meetup');

  INSERT INTO tags (name) VALUES
    ('pottery'), ('beginner-friendly'), ('kid-friendly'), ('poetry'), ('knitting'),
    ('painting'), ('materials included'), ('outdoor'), ('coffee'), ('books');

  INSERT INTO events (venue_id, activity_type_id, title, description, what_to_bring, start_time, end_time, price) VALUES
    (1, 1, 'Intro to Wheel Throwing', 'Learn to center clay and throw your first bowl on the wheel.', 'Clothes that can get messy', '2026-11-08 18:00', '2026-11-08 20:00', 45),
    (1, 5, 'Sip & Sketch Morning', 'Casual drawing meetup over pour-over coffee.', 'A sketchbook and pencils', '2026-11-09 09:30', '2026-11-09 11:00', 0),
    (2, 3, 'Poetry Open Mic Night', 'Sign up at the door and share up to five minutes of your work.', 'Your poems', '2026-11-12 19:00', '2026-11-12 21:30', 5),
    (2, 5, 'Zine Swap & Book Club', 'Trade zines and discuss this month''s indie pick.', 'Zines to swap (optional)', '2026-11-15 14:00', '2026-11-15 16:00', 0),
    (3, 2, 'Knitting for Absolute Beginners', 'Cast on, knit, purl, and bind off a small swatch.', 'Nothing — needles and yarn provided', '2026-11-10 17:30', '2026-11-10 19:30', 30),
    (3, 4, 'Handmade Holiday Market', 'Local makers sell ceramics, prints, and knitwear.', 'A tote bag', '2026-12-06 10:00', '2026-12-06 16:00', 0),
    (4, 1, 'Watercolor Landscapes', 'A guided four-hour watercolor session with a pro illustrator.', 'Nothing — paper and paints provided', '2026-11-14 12:00', '2026-11-14 16:00', 85),
    (4, 2, 'Kids Painting Hour', 'Bright, messy painting fun for ages 5–10.', 'A smock or old t-shirt', '2026-11-16 10:00', '2026-11-16 11:00', 15);

  INSERT INTO event_tags (event_id, tag_id) VALUES
    (1, 1), (1, 2), (1, 7),
    (2, 6), (2, 9), (2, 2),
    (3, 4), (3, 10),
    (4, 10),
    (5, 5), (5, 2), (5, 7),
    (6, 1), (6, 5), (6, 8),
    (7, 6), (7, 7),
    (8, 6), (8, 3), (8, 2);

  INSERT INTO event_images (event_id, url, position)
  SELECT id, 'https://picsum.photos/seed/localbloom-' || id || '/800/500', 0 FROM events;
`

try {
  await pool.query(schema)
  await pool.query(seed)
  console.log('Database reset and seeded')
} catch (err) {
  console.error('Database reset failed:', err.message)
  process.exitCode = 1
} finally {
  await pool.end()
}
