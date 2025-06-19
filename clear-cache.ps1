Write-Host "Clearing Next.js cache and temporary files..." -ForegroundColor Yellow
Write-Host ""

Set-Location frontend

Write-Host "Removing .next directory..." -ForegroundColor Cyan
if (Test-Path .next) {
    Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
    Write-Host "✓ .next directory removed" -ForegroundColor Green
} else {
    Write-Host "ℹ .next directory not found" -ForegroundColor Blue
}

Write-Host ""
Write-Host "Clearing npm cache..." -ForegroundColor Cyan
npm cache clean --force

Write-Host ""
Write-Host "Cache cleared successfully!" -ForegroundColor Green
Write-Host "You can now run 'npm run dev' to restart the development servers." -ForegroundColor White
Write-Host ""

Set-Location .. 