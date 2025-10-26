# Delete conflicting Clerk folders
Write-Host "Deleting conflicting Clerk folders..." -ForegroundColor Yellow

$signInFolder = "src\app\sign-in\[[...sign-in]]"
$signUpFolder = "src\app\sign-up\[[...sign-up]]"

if (Test-Path $signInFolder) {
    Remove-Item -Path $signInFolder -Recurse -Force
    Write-Host "✓ Deleted $signInFolder" -ForegroundColor Green
} else {
    Write-Host "✗ $signInFolder not found" -ForegroundColor Red
}

if (Test-Path $signUpFolder) {
    Remove-Item -Path $signUpFolder -Recurse -Force
    Write-Host "✓ Deleted $signUpFolder" -ForegroundColor Green
} else {
    Write-Host "✗ $signUpFolder not found" -ForegroundColor Red
}

Write-Host "`nDone! Now restart your dev server." -ForegroundColor Cyan
