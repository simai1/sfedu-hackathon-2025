@echo off
chcp 65001 >nul
echo ========================================
echo Сборка исполняемого файла Bit App
echo ========================================
echo.

REM Проверка наличия PyInstaller
python -c "import PyInstaller" 2>nul
if errorlevel 1 (
    echo [ОШИБКА] PyInstaller не установлен!
    echo Устанавливаю PyInstaller...
    pip install pyinstaller
    if errorlevel 1 (
        echo [ОШИБКА] Не удалось установить PyInstaller
        pause
        exit /b 1
    )
)

echo [INFO] PyInstaller найден
echo.

REM Очистка предыдущих сборок
if exist "build" (
    echo [INFO] Удаление старой папки build...
    rmdir /s /q build
)

if exist "dist" (
    echo [INFO] Удаление старой папки dist...
    rmdir /s /q dist
)

echo [INFO] Начинаю сборку...
echo.

REM Запуск PyInstaller с spec файлом
pyinstaller build.spec

if errorlevel 1 (
    echo.
    echo [ОШИБКА] Сборка завершилась с ошибкой!
    pause
    exit /b 1
)

echo.
echo ========================================
echo Сборка завершена успешно!
echo ========================================
echo.
echo Исполняемый файл находится в папке: dist\BitApp.exe
echo.
pause

