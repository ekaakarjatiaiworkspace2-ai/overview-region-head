@echo off
set /p REPO_URL="Masukkan URL Repository GitHub Bos (contoh: https://github.com/ekaakarjatiaiworkspace2-ai/eka-management.git): "
if "%REPO_URL%"=="" (
    echo URL tidak boleh kosong!
    pause
    exit /b
)
git remote remove origin 2>nul
git remote add origin %REPO_URL%
git branch -M main
echo Mengirim kode ke GitHub...
git push -u origin main
echo.
echo Selesai! Silakan refresh halaman Render.com bos.
pause
