@echo off
echo Iniciando Docker Desktop...

REM Intentar iniciar Docker Desktop
start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"

echo Esperando a que Docker Desktop se inicie...
timeout /t 30 /nobreak

REM Verificar si Docker está funcionando
docker info >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo Docker Desktop iniciado correctamente.
    echo Ahora puedes ejecutar 'docker-compose up -d postgres' para iniciar la base de datos.
) else (
    echo Docker Desktop aún no está listo.
    echo Por favor, espera unos minutos más y verifica manualmente.
    echo Si el problema persiste, reinicia tu computadora.
)

pause