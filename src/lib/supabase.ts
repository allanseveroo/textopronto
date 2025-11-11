import { createBrowserClient } from '@supabase/ssr'

// Hardcoded credentials to ensure connection
const supabaseUrl = 'https://eygvgoqtpwjjxmpnxbmc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5Z3Znb3F0cHdqanhtcG54Ym1jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NjcyMDYsImV4cCI6MjA3ODQ0MzIwNn0.p_jhRGO0KmnZQsCIbs3ByuyucBgB_LyeVrim913tALA';

export const supabase = createBrowserClient(
  supabaseUrl,
  supabaseAnonKey
)
