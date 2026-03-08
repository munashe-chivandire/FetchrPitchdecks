-- ══════════════════════════════════════════════
-- Fetchr Pitch Deck — Annotations Schema
-- Run this in your Supabase SQL Editor
-- ══════════════════════════════════════════════

-- Annotations table
CREATE TABLE annotations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  deck_id TEXT NOT NULL,
  slide_number INTEGER NOT NULL,
  x_percent FLOAT NOT NULL,
  y_percent FLOAT NOT NULL,
  content TEXT NOT NULL,
  author TEXT NOT NULL DEFAULT 'Anonymous',
  type TEXT NOT NULL DEFAULT 'comment' CHECK (type IN ('comment', 'suggestion')),
  resolved BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookups by deck
CREATE INDEX idx_annotations_deck ON annotations (deck_id, slide_number);

-- Enable Row Level Security
ALTER TABLE annotations ENABLE ROW LEVEL SECURITY;

-- Open access policies (no auth required for now)
CREATE POLICY "Anyone can read annotations"
  ON annotations FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create annotations"
  ON annotations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update annotations"
  ON annotations FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete annotations"
  ON annotations FOR DELETE
  USING (true);

-- Enable real-time for this table
ALTER PUBLICATION supabase_realtime ADD TABLE annotations;
