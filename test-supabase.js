const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://bnntozilollusgewlabn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJubnRvemlsb2xsdXNnZXdsYWJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyOTM1ODQsImV4cCI6MjA5MDg2OTU4NH0.9BBU_pbfyrsn5DarnpPNqI5v3ZCm3tInY9oYL6B7WnI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('Testing connection to Supabase...');
  try {
    const { data, error } = await supabase.from('sabhas').select('*').limit(1);
    if (error) {
      console.error('Supabase Error:', error);
    } else {
      console.log('Connection Successful! Data:', data);
    }
  } catch (err) {
    console.error('System Error:', err);
  }
}

testConnection();
