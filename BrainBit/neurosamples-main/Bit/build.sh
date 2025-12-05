#!/bin/bash

echo "========================================"
echo "Сборка исполняемого файла Bit App"
echo "========================================"
echo ""

# Проверка наличия PyInstaller
if ! python3 -c "import PyInstaller" 2>/dev/null; then
    echo "[ОШИБКА] PyInstaller не установлен!"
    echo "Устанавливаю PyInstaller..."
    pip3 install pyinstaller
    if [ $? -ne 0 ]; then
        echo "[ОШИБКА] Не удалось установить PyInstaller"
        exit 1
    fi
fi

echo "[INFO] PyInstaller найден"
echo ""

# Очистка предыдущих сборок
if [ -d "build" ]; then
    echo "[INFO] Удаление старой папки build..."
    rm -rf build
fi

if [ -d "dist" ]; then
    echo "[INFO] Удаление старой папки dist..."
    rm -rf dist
fi

echo "[INFO] Начинаю сборку..."
echo ""

# Запуск PyInstaller с spec файлом
pyinstaller build.spec

if [ $? -ne 0 ]; then
    echo ""
    echo "[ОШИБКА] Сборка завершилась с ошибкой!"
    exit 1
fi

echo ""
echo "========================================"
echo "Сборка завершена успешно!"
echo "========================================"
echo ""
echo "Исполняемый файл находится в папке: dist/BitApp"
echo ""

