@echo off
REM ============================================
REM  FluoDelivery - Para todos os containers
REM  (os dados do banco ficam salvos no volume)
REM ============================================

cd /d "%~dp0"

echo.
echo Parando containers do FluoDelivery...
docker compose down

echo.
echo Containers parados. Os dados do banco foram preservados.
echo Para subir novamente: iniciar.bat
echo.
pause
