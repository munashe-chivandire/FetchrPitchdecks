/**
 * Supabase Configuration
 * Replace these with your actual Supabase project credentials.
 * These are PUBLIC keys — safe for client-side use.
 */
const SUPABASE_URL = 'https://tjdqqjioothgencfjpfz.supabase.co;   // e.g. https://abcdefg.supabase.co
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqZHFxamlvb3RoZ2VuY2ZqcGZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5MzA4MzIsImV4cCI6MjA4ODUwNjgzMn0.lz0xdx_4_gQzhWcJYPxpwo-_A2kuByFM6x15Umq1Vv0';

// Initialize Supabase client (supabase-js loaded via CDN before this file)
const _supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
