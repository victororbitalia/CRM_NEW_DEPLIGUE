@echo off
echo Iniciando PostgreSQL para el CRM Restaurante...

REM Verificar si PostgreSQL está instalado
sc query postgresql-x64-14 >nul 2>&1
if %ERRORLEVEL% EQU 1060 (
    echo PostgreSQL no está instalado como servicio.
    echo Por favor, instala PostgreSQL desde https://www.postgresql.org/download/windows/
    pause
    exit /b 1
)

REM Iniciar el servicio de PostgreSQL
echo Iniciando el servicio de PostgreSQL...
net start postgresql-x64-14

if %ERRORLEVEL% EQU 0 (
    echo PostgreSQL iniciado correctamente.
    
    REM Verificar si la base de datos existe
    echo Verificando si la base de datos restaurant_crm_dev existe...
    psql -U postgres -c "SELECT 1 FROM pg_database WHERE datname='restaurant_crm_dev'" >nul 2>&1
    
    if %ERRORLEVEL% NEQ 0 (
        echo Creando base de datos restaurant_crm_dev...
        createdb -U postgres restaurant_crm_dev
        if %ERRORLEVEL% EQU 0 (
            echo Base de datos creada correctamente.
        ) else (
            echo Error al crear la base de datos. Verifica la contraseña del usuario postgres.
        )
    ) else (
        echo La base de datos restaurant_crm_dev ya existe.
    )
    
    echo.
    echo Database configurada correctamente!
    echo Ahora puedes ejecutar 'npm run dev' para iniciar la aplicación.
) else (
    echo Error al iniciar PostgreSQL.
    echo Verifica que PostgreSQL esté instalado correctamente.
)

pause