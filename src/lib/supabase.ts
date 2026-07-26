import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** True only when the leaderboard backend has been configured at build time. */
export const isSupabaseConfigured = Boolean(url && anonKey);

/**
 * A single Supabase client, or `null` when env vars are absent. Everything
 * leaderboard-related no-ops in that case, so the app stays fully functional
 * offline / when the backend isn't set up.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url!, anonKey!, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null;
