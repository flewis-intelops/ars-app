import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) ??
  "https://eshkbpexsrkqhzmadfdo.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzaGticGV4c3JrcWh6bWFkZmRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MzQ3MjEsImV4cCI6MjA5NDExMDcyMX0.aESGlDXU6S__8cstXZNmQRMSpB-o8eJAa7AhreXbr4U";

export const SUPABASE_PROJECT_ID = "eshkbpexsrkqhzmadfdo";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});