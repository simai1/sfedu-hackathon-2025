#!/bin/bash

# Скрипт для создания .app пакета macOS из собранного исполняемого файла

echo "========================================"
echo "Создание .app пакета для macOS"
echo "========================================"
echo ""

APP_NAME="BitApp"
APP_DIR="dist/${APP_NAME}.app"
CONTENTS_DIR="${APP_DIR}/Contents"
MACOS_DIR="${CONTENTS_DIR}/MacOS"
RESOURCES_DIR="${CONTENTS_DIR}/Resources"

# Проверяем наличие исполняемого файла
if [ ! -f "dist/${APP_NAME}" ]; then
    echo "[ОШИБКА] Исполняемый файл dist/${APP_NAME} не найден!"
    echo "Сначала выполните сборку: ./build_macos.sh"
    exit 1
fi

# Создаем структуру .app пакета
echo "[INFO] Создание структуры .app пакета..."
mkdir -p "${MACOS_DIR}"
mkdir -p "${RESOURCES_DIR}"

# Копируем исполняемый файл
echo "[INFO] Копирование исполняемого файла..."
cp "dist/${APP_NAME}" "${MACOS_DIR}/"

# Делаем файл исполняемым
chmod +x "${MACOS_DIR}/${APP_NAME}"

# Создаем Info.plist
echo "[INFO] Создание Info.plist..."
cat > "${CONTENTS_DIR}/Info.plist" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>${APP_NAME}</string>
    <key>CFBundleIdentifier</key>
    <string>com.brainbit.${APP_NAME}</string>
    <key>CFBundleName</key>
    <string>${APP_NAME}</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0</string>
    <key>CFBundleVersion</key>
    <string>1</string>
    <key>LSMinimumSystemVersion</key>
    <string>10.13</string>
    <key>NSHighResolutionCapable</key>
    <true/>
</dict>
</plist>
EOF

echo ""
echo "========================================"
echo ".app пакет создан успешно!"
echo "========================================"
echo ""
echo "Пакет находится в: ${APP_DIR}"
echo ""
echo "Для запуска:"
echo "  open ${APP_DIR}"
echo ""
echo "Для подписи кода (опционально, требуется Apple Developer ID):"
echo "  codesign --deep --force --verify --verbose --sign \"Developer ID Application: Your Name\" ${APP_DIR}"
echo ""

