const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://bnntozilollusgewlabn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJubnRvemlsb2xsdXNnZXdsYWJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyOTM1ODQsImV4cCI6MjA5MDg2OTU4NH0.9BBU_pbfyrsn5DarnpPNqI5v3ZCm3tInY9oYL6B7WnI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSamparkProfile() {
  console.log('Checking sampark profile role...');
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', 'abc23a48-434a-42e8-af91-6627fae34db2');
    
    if (error) console.error(error);
    else console.log(data);
  } catch (err) {
    console.error(err);
  }
}

checkSamparkProfile();
