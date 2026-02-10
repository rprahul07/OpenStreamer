# Load environment variables from .env file
Get-Content .env | ForEach-Object { 
    if ($_ -match '^([^=]+)=(.*)$') { 
        [System.Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process") 
    } 
}

# Start the server
Write-Host "Starting server with environment variables loaded..."
npx tsx server/index.ts
