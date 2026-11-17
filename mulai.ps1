Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "  MENYALAKAN EKA BUSINESS MANAGEMENT PLATFORM (BSI)  " -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host ""

$rootPath = $PSScriptRoot
if (-not $rootPath) { $rootPath = (Get-Location).Path }

# Cek dan bersihkan port 5173 jika ada proses lama yang masih tersangkut
$p5173 = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue
if ($p5173) {
    Write-Host "Mereset proses lama yang menggunakan port 5173..." -ForegroundColor DarkGray
    $p5173 | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
    Start-Sleep -Milliseconds 600
}

# Cek dan bersihkan port 8787 jika ada proses lama yang masih tersangkut
$p8787 = Get-NetTCPConnection -LocalPort 8787 -ErrorAction SilentlyContinue
if ($p8787) {
    Write-Host "Mereset proses lama yang menggunakan port 8787..." -ForegroundColor DarkGray
    $p8787 | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
    Start-Sleep -Milliseconds 600
}

Write-Host "[1/2] Menyalakan Backend API Engine (Fastify Port 8787)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$rootPath'; Write-Host 'Backend API Engine Aktif di http://127.0.0.1:8787' -ForegroundColor Green; npm run dev:api"

Start-Sleep -Seconds 2

Write-Host "[2/2] Menyalakan Frontend Web Dashboard (Vite Port 5173)..." -ForegroundColor Green
Write-Host ""
Write-Host "Buka browser di: http://localhost:5173" -ForegroundColor Cyan
Write-Host "Tekan Ctrl + C di terminal ini jika ingin menghentikan web." -ForegroundColor DarkGray
Write-Host ""

npm run dev:web
