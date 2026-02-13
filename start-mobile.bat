@echo off
echo Starting Stream Curator Academic Platform...

echo.
echo [1/3] Installing dependencies...
call npm install

echo.
echo [2/3] Installing AWS and security dependencies...
call npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner bcrypt jsonwebtoken cors

echo.
echo [3/3] Starting Expo development server...
echo Make sure your backend server is running first (run-server.ps1)
echo.
npx expo start --lan

pause
