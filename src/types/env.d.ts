/**
 * Type declarations for environment variables
 */
declare module '@env' {
  export const SUPABASE_URL: string;
  export const SUPABASE_ANON_KEY: string;
  export const APP_ENV: string;
  // Optional: Hugging Face Inference API key (format: hf_xxx)
  export const HUGGINGFACE_API_KEY: string;
}
