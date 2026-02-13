# Set environment variables manually
$env:SUPABASE_URL = "https://cqjhkqcsgimstsuxybjs.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxamhrcWNzZ2ltc3RzdXh5YmpzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDY0MTc2NiwiZXhwIjoyMDg2MjE3NzY2fQ.533MoVvXXcbVMGYdr9KXzoYzM1CUfw6k-ODrb6wwfZI"
$env:PORT = "5000"
$env:NODE_ENV = "development"
$env:UPLOAD_DIR = "./uploads"
$env:MAX_FILE_SIZE = "50MB"
$env:JWT_SECRET = "academic-platform-jwt-secret-key-2024"
$env:AWS_ACCESS_KEY_ID = "your-aws-access-key"
$env:AWS_SECRET_ACCESS_KEY = "your-aws-secret-key"
$env:AWS_REGION = "us-east-1"
$env:AWS_BUCKET_NAME = "your-bucket-name"

Write-Host "Environment variables set. Starting Academic Platform Server..."
Write-Host "JWT_SECRET: $env:JWT_SECRET"
node server/src/server.js
