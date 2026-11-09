CREATE TABLE IF NOT EXISTS visits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  visited_at INTEGER NOT NULL,
  visit_bucket INTEGER NOT NULL,
  session_id TEXT NOT NULL,
  path TEXT NOT NULL,
  referrer_host TEXT NOT NULL DEFAULT 'Direct',
  device TEXT NOT NULL DEFAULT 'unknown',
  country_code TEXT NOT NULL DEFAULT '',
  country TEXT NOT NULL DEFAULT 'Unknown country',
  region TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  latitude REAL,
  longitude REAL,
  UNIQUE(session_id, path, visit_bucket)
);

CREATE INDEX IF NOT EXISTS visits_time_index ON visits(visited_at DESC);
CREATE INDEX IF NOT EXISTS visits_location_index ON visits(country_code, city, visited_at DESC);
