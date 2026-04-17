@echo off
REM ============================================
REM  FluoDelivery - Script unico de inicializacao
REM  Caminho padrao: Docker na porta 8085
REM ============================================

cd /d "%~dp0"

echo.
echo ============================================
echo   FluoDelivery - Iniciando ambiente Docker
echo ============================================
echo.

REM --- 1. Verifica se o Docker esta rodando ---
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Docker Desktop nao esta rodando.
    echo        Abra o Docker Desktop e tente novamente.
    pause
    exit /b 1
)

REM --- 2. Sobe os containers (postgres, api, web, seed) ---
echo [1/3] Subindo containers...
docker compose up -d
if errorlevel 1 (
    echo [ERRO] Falha ao subir os containers.
    pause
    exit /b 1
)

REM --- 3. Espera API ficar pronta ---
echo.
echo [2/3] Aguardando API ficar pronta (isso pode levar ate 30s)...
set /a tentativas=0
:esperar
timeout /t 2 /nobreak >nul
curl -s -o nul -w "%%{http_code}" http://localhost:3002/api/health 2>nul | findstr "200" >nul
if errorlevel 1 (
    set /a tentativas+=1
    if %tentativas% lss 15 goto esperar
    echo [AVISO] API demorou para responder, mas abrindo mesmo assim...
)

REM --- 4. Abre o navegador ---
echo.
echo [3/3] Abrindo navegador em http://localhost:8085
start "" "http://localhost:8085"

echo.
echo ============================================
echo   Pronto! Use sempre este endereco:
echo.
echo     Frontend:  http://localhost:8085
echo     API:       http://localhost:3002/api
echo     Banco:     localhost:5433
echo.
echo   Login padrao:
echo     Email:  admin@fluodelivery.com
echo     Senha:  admin123
echo.
echo   Para parar tudo: parar.bat
echo ============================================
echo.
pause
