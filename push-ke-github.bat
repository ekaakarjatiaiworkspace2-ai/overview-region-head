@echo off
setlocal
cd /d "%~dp0"
if exist "eka-management-web-starter\.git" (
    cd "eka-management-web-starter"
)
echo ========================================================
echo   EKA PLATFORM - PUSH KE GITHUB
echo   Folder kerja: %CD%
echo ========================================================
echo.
set /p REPO_URL="Masukkan URL Repository GitHub Bos: "
if "%REPO_URL%"=="" (
    echo [ERROR] URL tidak boleh kosong!
    pause
    exit /b
)
git remote remove origin 2>nul
git remote add origin %REPO_URL%
git branch -M main
echo.
echo Mengirim kode ke GitHub...
git push -u origin main
echo.
if %errorlevel% equ 0 (
    echo ========================================================
    echo   BERHASIL! Kode sudah terkirim ke GitHub.
    echo   Silakan kembali ke halaman Render.com lalu refresh (F5).
    echo ========================================================
) else (
    echo ========================================================
    echo   Ada kendala saat push. Pastikan URL sudah benar dan
    echo   sudah login ke GitHub di browser.
    echo ========================================================
)
pause
