/*
  # Add Profiles, Wishlists, Verification Requests, and Property Seeds

  1. New Tables
    - `profiles`
      - stores onboarding, verification, and profile data per authenticated user
    - `wishlists`
      - stores saved properties per user
    - `verification_requests`
      - stores property proof requests per user and property

  2. Security
    - Enable RLS on all tables
    - Allow users to manage only their own profile and wishlist rows
    - Allow authenticated users to create verification requests for themselves
    - Allow public read access to verification requests for aggregate counts

  3. Seed Data
    - Inserts baseline property records when `properties` is empty
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone text,
  email text,
  name text,
  city text,
  roles text[] DEFAULT '{}'::text[],
  profile_image text,
  verified boolean DEFAULT false,
  onboarding_completed boolean DEFAULT false,
  onboarding_dismissed boolean DEFAULT false,
  identity_verification_status text DEFAULT 'unverified',
  property_document_status text DEFAULT 'unverified',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE TABLE IF NOT EXISTS wishlists (
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, property_id)
);

ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wishlist"
  ON wishlists
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wishlist"
  ON wishlists
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own wishlist"
  ON wishlists
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS verification_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  requester_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (property_id, requester_id)
);

ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view verification requests"
  ON verification_requests
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can request verification"
  ON verification_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = requester_id);

INSERT INTO properties (
  image,
  price,
  area,
  location,
  category,
  type,
  description,
  verified,
  seller_verified,
  market_price,
  government_rate
)
SELECT *
FROM (
  VALUES
    (
      'https://images.pexels.com/photos/186077/pexels-photo-186077.jpeg?auto=compress&cs=tinysrgb&w=800',
      8500000,
      2400,
      'Model Town, Rohtak',
      'Residential',
      'House',
      'Verified residential house in Model Town, Rohtak.',
      true,
      true,
      8200000,
      7800000
    ),
    (
      'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=800',
      4500000,
      1200,
      'Sector 21, Rohtak',
      'Residential',
      'Flat',
      'Residential flat in Sector 21, Rohtak with strong connectivity.',
      true,
      false,
      4800000,
      4600000
    ),
    (
      'https://images.pexels.com/photos/259588/pexels-photo-259588.jpeg?auto=compress&cs=tinysrgb&w=800',
      15000000,
      5000,
      'Sector 25, Rohtak',
      'Residential',
      'House',
      'Large residential property in Sector 25, Rohtak.',
      true,
      true,
      14500000,
      14000000
    ),
    (
      'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=800',
      2500000,
      2000,
      'Sector 27, Rohtak',
      'Agricultural',
      NULL,
      'Agricultural parcel positioned near Sector 27, Rohtak.',
      false,
      true,
      2800000,
      2400000
    ),
    (
      'https://images.pexels.com/photos/380768/pexels-photo-380768.jpeg?auto=compress&cs=tinysrgb&w=800',
      12000000,
      3500,
      'Sector 35, Rohtak',
      'Commercial',
      NULL,
      'Commercial space in Sector 35, Rohtak for office or retail use.',
      true,
      true,
      11500000,
      11000000
    ),
    (
      'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=800',
      3200000,
      1500,
      'Omaxe City, Rohtak',
      'Residential',
      'Flat',
      'Compact residential flat in Omaxe City, Rohtak.',
      true,
      true,
      3100000,
      3000000
    )
) AS seed_data (
  image,
  price,
  area,
  location,
  category,
  type,
  description,
  verified,
  seller_verified,
  market_price,
  government_rate
)
WHERE NOT EXISTS (SELECT 1 FROM properties LIMIT 1);
