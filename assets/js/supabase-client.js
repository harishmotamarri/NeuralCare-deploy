// Replace with your Supabase project URL and anon public key
const supabaseUrl = 'https://plvlcxrpenxhfturwsyt.supabase.co';
const supabaseKey = 'sb_publishable_-ebrmkrW5mIkADf9KqkyJw_uZgQYBgk';

// Initialize Supabase Client
const supabaseInstance = window.supabase.createClient(supabaseUrl, supabaseKey);

// Make it available globally
window.supabaseClient = supabaseInstance;

console.log('Supabase client initialized successfully.');
