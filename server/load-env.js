const fs = require('fs');

try {
  const envFile = fs.readFileSync('.env', 'utf8');
  console.log('Loading .env file...');
  
  envFile.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=');
        process.env[key.trim()] = value.trim();
        console.log(`Loaded: ${key.trim()}`);
      }
    }
  });
  
  console.log('Environment variables loaded successfully');
  console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'SET' : 'NOT SET');
} catch (error) {
  console.log('No .env file found, using system environment variables');
}
