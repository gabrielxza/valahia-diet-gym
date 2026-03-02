@echo off
echo ========================================
echo   Diet Tracker PWA - Server Locale
echo ========================================
echo.
echo Avvio server su http://localhost:8000
echo.
echo Apri nel browser:
echo   http://localhost:8000/login.html
echo.
echo Premi CTRL+C per fermare il server
echo ========================================
echo.

python -m http.server 8000
