/*
  # Add RLS policy for viewing referred profiles

  1. New Policy
    - `Users can read referred profiles` - Allows users to read profiles where they are the referrer
    - This enables the referral system to show users who they have referred

  2. Security
    - Policy only allows reading profiles where `referred_by` equals the current user's ID
    - Maintains data privacy while enabling referral functionality
*/

-- Add policy to allow users to read profiles of people they referred
CREATE POLICY "Users can read referred profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (referred_by = auth.uid());