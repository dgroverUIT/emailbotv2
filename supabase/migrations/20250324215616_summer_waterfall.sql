/*
  # Create Bots Table and Triggers

  1. New Tables
    - `bots`
      - `id` (uuid, primary key)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `name` (text)
      - `email` (text)
      - `description` (text)
      - `forwarding_email` (text)
      - `assistant_id` (text)
      - `user_id` (uuid, references auth.users)

  2. Security
    - Enable RLS on `bots` table
    - Add policies for CRUD operations
    - Only authenticated users can access their own bots

  3. Triggers
    - Add after_bot_insert trigger for assistant creation
*/

-- Create bots table
CREATE TABLE IF NOT EXISTS bots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  name text NOT NULL,
  email text NOT NULL,
  description text,
  forwarding_email text NOT NULL,
  assistant_id text,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  UNIQUE(email)
);

-- Enable RLS
ALTER TABLE bots ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can create their own bots"
  ON bots
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own bots"
  ON bots
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own bots"
  ON bots
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bots"
  ON bots
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_bots_updated_at
  BEFORE UPDATE ON bots
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create after_bot_insert trigger
CREATE OR REPLACE FUNCTION after_bot_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- This will be implemented later to call the edge function
  -- Parameters will be: NEW.name, NEW.description, NEW.email
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER after_bot_insert_trigger
  AFTER INSERT ON bots
  FOR EACH ROW
  EXECUTE FUNCTION after_bot_insert();