@echo off
title File Converter
cd /d "%~dp0"

echo Iniciando File Converter...
echo.

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ERRO: Node.js nao encontrado. Instale em https://nodejs.org
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo Instalando dependencias pela primeira vez...
    echo Isso pode demorar alguns minutos.
    echo.
    npm install
    if %errorlevel% neq 0 (
        echo ERRO: Falha ao instalar dependencias.
        pause
        exit /b 1
    )
)

npm run dev
