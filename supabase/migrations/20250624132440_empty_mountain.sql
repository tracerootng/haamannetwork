/*
  # Fix Admin Login and RLS Recursion Issues

  1. Problem
    - Infinite recursion in RLS policies causing admin login failures
    - "Access denied. Admin privileges required" error when admins try to log in
    - Circular dependencies between tables with RLS policies

  2. Solution
    - Create a secure RPC function to check admin status
    - This function bypasses RLS completely and can be called directly
    - Update admin login flow to use this function

  3. Changes
    - Add is_admin_user() RPC function that's callable from client
    - Ensure it's secure and properly checks admin status
*/

-- Create a secure RPC function to check if current user is admin
-- This can be called directly from the client without triggering RLS recursion
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  is_admin boolean;
BEGIN
  -- Return false if no user is authenticated
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check admin status directly from the profiles table
  -- Using empty search_path and SECURITY DEFINER to bypass RLS
  SELECT p.is_admin INTO is_admin
  FROM public.profiles p
  WHERE p.id = auth.uid();
  
  -- Return the result, defaulting to false if no record found
  RETURN COALESCE(is_admin, false);
EXCEPTION
  WHEN OTHERS THEN
    -- Return false on any error to prevent policy failures
    RETURN false;
END;
$$;

-- Grant execute permission to the function for authenticated users
GRANT EXECUTE ON FUNCTION is_admin_user() TO authenticated;