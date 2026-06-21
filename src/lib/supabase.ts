import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (supabaseClient) return supabaseClient;
  
  const url = localStorage.getItem('supabase_url') || 'https://vqbnzcknflwuhbiznuim.supabase.co';
  const key = localStorage.getItem('supabase_anon_key') || 'sb_publishable_YKSbWVBxAltMjpIxGhNAIg_Ga8B9xST';
  
  if (url && key) {
    try {
      supabaseClient = createClient(url, key);
      return supabaseClient;
    } catch (e) {
      console.error("Failed to initialize Supabase:", e);
      return null;
    }
  }
  return null;
}

export function resetSupabaseClient() {
    supabaseClient = null;
}
