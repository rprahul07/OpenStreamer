# Set environment variables manually
$env:SUPABASE_URL = "https://cqjhkqcsgimstsuxybjs.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxamhrcWNzZ2ltc3RzdXh5YmpzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDY0MTc2NiwiZXhwIjoyMDg2MjE3NzY2fQ.533MoVvXXcbVMGYdr9KXzoYzM1CUfw6k-ODrb6wwfZI"
$env:PORT = "5000"
$env:NODE_ENV = "development"
$env:UPLOAD_DIR = "./uploads"
$env:MAX_FILE_SIZE = "50MB"

Write-Host "Environment variables set. Starting server..."
npx tsx server/index.ts
