/*
  # Create Properties Table

  1. New Tables
    - `properties`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `image` (text, property image URL)
      - `price` (bigint, property price)
      - `area` (integer, property area in sq ft)
      - `location` (text, property location)
      - `category` (text, property category: Agricultural/Residential/Commercial)
      - `type` (text, property type for residential: Plot/House/Flat/Builder Floor)
      - `description` (text, property description)
      - `verified` (boolean, whether property is verified)
      - `seller_verified` (boolean, whether seller is verified)
      - `market_price` (bigint, estimated market price)
      - `government_rate` (bigint, government rate)
      - `created_at` (timestamptz, creation timestamp)
      - `updated_at` (timestamptz, update timestamp)

  2. Security
    - Enable RLS on `properties` table
    - Add policy for public read access to properties
    - Add policy for authenticated users to create properties
    - Add policy for users to update their own properties
    - Add policy for users to delete their own properties
*/

CREATE TABLE IF NOT EXISTS properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  image text NOT NULL,
  price bigint NOT NULL,
  area integer NOT NULL,
  location text NOT NULL,
  category text NOT NULL,
  type text,
  description text,
  verified boolean DEFAULT false,
  seller_verified boolean DEFAULT false,
  market_price bigint,
  government_rate bigint,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view properties"
  ON properties
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create properties"
  ON properties
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own properties"
  ON properties
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own properties"
  ON properties
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);