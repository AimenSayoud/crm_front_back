@echo off
echo Clearing Next.js cache and temporary files...
echo.

cd frontend
echo Removing .next directory...
if exist .next (
    rmdir /s /q .next
    echo ✓ .next directory removed
) else (
    echo ℹ .next directory not found
)

echo.
echo Clearing npm cache...
npm cache clean --force

echo.
echo Cache cleared successfully!
echo You can now run "npm run dev" to restart the development servers.
echo.
pause 