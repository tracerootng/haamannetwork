/*
  # Fix RLS infinite recursion in profiles table

  1. Problem
    - The is_admin_user() function is causing infinite recursion
    - Function uses 'SET search_path = public' which still triggers RLS
    - This causes the profiles policies to recursively call themselves

  2. Solution
    - Change search_path to empty string to completely bypass RLS
    - This ensures the function can query profiles table without triggering policies

  3. Changes
    - Update is_admin_user() function with proper search_path setting
*/

-- Drop and recreate the is_admin_user function with correct search_path
DROP FUNCTION IF EXISTS is_admin_user();

-- Create a SECURITY DEFINER function to check if current user is admin
-- This function completely bypasses RLS on profiles table to prevent recursion
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Return false if no user is authenticated
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check admin status without triggering RLS by using empty search_path
  RETURN COALESCE(
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid() LIMIT 1),
    false
  );
EXCEPTION
  WHEN OTHERS THEN
    -- Return false on any error to prevent policy failures
    RETURN false;
END;
$$;