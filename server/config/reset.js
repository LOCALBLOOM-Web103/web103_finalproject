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

try {
  await pool.query(schema)
  console.log('Database reset')
} catch (err) {
  console.error('Database reset failed:', err.message)
  process.exitCode = 1
} finally {
  await pool.end()
}
