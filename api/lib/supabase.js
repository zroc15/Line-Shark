import { createClient } from '@supabase/supabase-js'

// Server-side Supabase client for API routes
// Uses service role key for write access (cron worker needs to insert rows)
let supabase = null

export function getSupabase() {
  if (supabase) return supabase

  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error('Supabase credentials not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)')
  }

  supabase = createClient(url, key)
  return supabase
}
