#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Скрипт для сборки исполняемого файла Bit App
"""
import subprocess
import sys
import os
import shutil

def check_pyinstaller():
    """Проверка наличия PyInstaller"""
    try:
        import PyInstaller
        print("[INFO] PyInstaller найден")
        return True
    except ImportError:
        print("[INFO] PyInstaller не найден, устанавливаю...")
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", "pyinstaller"])
            print("[INFO] PyInstaller успешно установлен")
            return True
        except subprocess.CalledProcessError:
            print("[ОШИБКА] Не удалось установить PyInstaller")
            return False

def clean_build_dirs():
    """Очистка папок build и dist"""
    dirs_to_clean = ['build', 'dist']
    for dir_name in dirs_to_clean:
        if os.path.exists(dir_name):
            print(f"[INFO] Удаление папки {dir_name}...")
            shutil.rmtree(dir_name)

def build_app():
    """Сборка приложения"""
    print("\n" + "="*50)
    print("Сборка исполняемого файла Bit App")
    print("="*50 + "\n")
    
    # Проверка PyInstaller
    if not check_pyinstaller():
        return False
    
    # Очистка старых сборок
    clean_build_dirs()
    
    # Проверка наличия spec файла
    if not os.path.exists('build.spec'):
        print("[ОШИБКА] Файл build.spec не найден!")
        return False
    
    print("[INFO] Начинаю сборку...\n")
    
    # Запуск PyInstaller
    try:
        subprocess.check_call([
            sys.executable, "-m", "PyInstaller", 
            "build.spec",
            "--clean",
            "--noconfirm"
        ])
        print("\n" + "="*50)
        print("Сборка завершена успешно!")
        print("="*50)
        print("\nИсполняемый файл находится в папке: dist/BitApp.exe")
        if sys.platform != 'win32':
            print("(или dist/BitApp на Linux/macOS)")
        print()
        return True
    except subprocess.CalledProcessError as e:
        print(f"\n[ОШИБКА] Сборка завершилась с ошибкой: {e}")
        return False

if __name__ == "__main__":
    success = build_app()
    sys.exit(0 if success else 1)

