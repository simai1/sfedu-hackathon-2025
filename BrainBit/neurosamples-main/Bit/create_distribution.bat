@echo off
chcp 65001 >nul
echo ========================================
echo Создание дистрибутива для распространения
echo ========================================
echo.

REM Проверка наличия собранного приложения
if not exist "dist\BitApp.exe" (
    echo [ОШИБКА] Исполняемый файл dist\BitApp.exe не найден!
    echo Сначала выполните сборку: build.bat
    pause
    exit /b 1
)

echo [INFO] Найден исполняемый файл
echo.

REM Создаем папку для дистрибутива
set DIST_DIR=distribution
if exist "%DIST_DIR%" (
    echo [INFO] Удаление старой папки distribution...
    rmdir /s /q "%DIST_DIR%"
)

echo [INFO] Создание структуры дистрибутива...
mkdir "%DIST_DIR%"
mkdir "%DIST_DIR%\BitApp"

REM Копируем исполняемый файл
echo [INFO] Копирование исполняемого файла...
copy "dist\BitApp.exe" "%DIST_DIR%\BitApp\"

REM Копируем README для пользователя
echo [INFO] Копирование документации...
copy "README_ПОЛЬЗОВАТЕЛЮ.md" "%DIST_DIR%\BitApp\README.txt"

REM Создаем краткую инструкцию
echo [INFO] Создание краткой инструкции...
(
echo ========================================
echo BIT APP - КРАТКАЯ ИНСТРУКЦИЯ
echo ========================================
echo.
echo УСТАНОВКА:
echo ----------
echo 1. Распакуйте этот архив в любую папку
echo 2. Запустите BitApp.exe
echo.
echo ПЕРВЫЙ ЗАПУСК:
echo --------------
echo Windows может показать предупреждение.
echo Нажмите "Подробнее" ^> "Выполнить в любом случае"
echo.
echo ИСПОЛЬЗОВАНИЕ:
echo --------------
echo 1. Включите устройство BrainBit
echo 2. В приложении нажмите "Обновить"
echo 3. Выберите ваше устройство из списка
echo 4. Следуйте инструкциям на экране
echo.
echo ПОДДЕРЖКА:
echo ----------
echo Подробная инструкция в файле README.txt
echo.
echo ========================================
) > "%DIST_DIR%\BitApp\ИНСТРУКЦИЯ.txt"

REM Создаем архив (если установлен 7-Zip)
echo.
echo [INFO] Попытка создать ZIP архив...
where 7z >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [INFO] Используется 7-Zip...
    cd "%DIST_DIR%"
    7z a -tzip BitApp.zip BitApp\*
    cd ..
    echo [INFO] Архив создан: %DIST_DIR%\BitApp.zip
) else (
    echo [WARNING] 7-Zip не найден. Создайте ZIP архив вручную из папки %DIST_DIR%\BitApp
    echo [INFO] Или установите 7-Zip: https://www.7-zip.org/
)

echo.
echo ========================================
echo Дистрибутив готов!
echo ========================================
echo.
echo Файлы находятся в папке: %DIST_DIR%\BitApp
echo.
echo Для распространения:
echo 1. Создайте ZIP архив из папки BitApp
echo 2. Загрузите архив на веб-сайт
echo 3. Пользователи смогут скачать и запустить приложение
echo.
pause

