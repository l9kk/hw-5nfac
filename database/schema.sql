-- SQL Schema for Realtime Multiplayer Game
-- Run this in your Supabase SQL Editor

-- Create the players table
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  x REAL NOT NULL DEFAULT 400,
  y REAL NOT NULL DEFAULT 300,
  color VARCHAR(7) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations for authenticated and anonymous users
-- (For a production app, you'd want more restrictive policies)
CREATE POLICY "Allow all operations on players" ON players
  FOR ALL USING (true)
  WITH CHECK (true);

-- Enable real-time subscriptions for the players table
ALTER PUBLICATION supabase_realtime ADD TABLE players;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_players_created_at ON players(created_at);
CREATE INDEX IF NOT EXISTS idx_players_id ON players(id);

-- Optional: Create a function to clean up old players (for maintenance)
CREATE OR REPLACE FUNCTION cleanup_old_players()
RETURNS void AS $$
BEGIN
  DELETE FROM players 
  WHERE created_at < NOW() - INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql;

-- Optional: You can set up a scheduled job to run cleanup
-- This would be done in the Supabase Dashboard under Database > Cron Jobs
-- SELECT cron.schedule('cleanup-old-players', '0 0 * * *', 'SELECT cleanup_old_players();');
