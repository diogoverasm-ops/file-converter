@echo off
title Compilando File Converter...
cd /d "%~dp0"

echo ============================================
echo   File Converter - Gerando instalador .exe
echo ============================================
echo.

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ERRO: Node.js nao encontrado. Instale em https://nodejs.org
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo [1/3] Instalando dependencias...
    npm install
    if %errorlevel% neq 0 (
        echo ERRO: Falha ao instalar dependencias.
        pause
        exit /b 1
    )
    echo.
)

echo [2/3] Compilando o projeto...
npm run package
if %errorlevel% neq 0 (
    echo ERRO: Falha ao compilar.
    pause
    exit /b 1
)

echo.
echo [3/3] Abrindo pasta com o instalador...
start "" "%~dp0dist"

echo.
echo ============================================
echo   Pronto! O instalador esta na pasta dist\
echo   Procure o arquivo "File Converter Setup.exe"
echo ============================================
echo.
pause
