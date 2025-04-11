import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-url-polyfill/auto';

const supabaseUrl = "https://fjkgjkkaiarvtpjqwqkq.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqa2dqa2thaWFydnRwanF3cWtxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA2MDQ0ODYsImV4cCI6MjA1NjE4MDQ4Nn0.lMJ4CVyRgMM6d8VXuqnUSvcVFMf5-GHOQx9Xx4R8N-E";

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export default supabase;