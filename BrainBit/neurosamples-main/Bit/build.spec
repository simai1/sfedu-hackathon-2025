# -*- mode: python ; coding: utf-8 -*-
import os
import glob
import site

block_cipher = None

# Собираем все UI файлы
ui_files = []
for ui_file in glob.glob('ui/*.ui'):
    ui_files.append((ui_file, 'ui'))

# Находим и добавляем DLL файлы из neurosdk и em_st_artifacts
neurosdk_binaries = []

def find_library_binaries(library_name, target_prefix):
    """Найти все DLL/so/dylib файлы в библиотеке"""
    binaries = []
    library_path = None
    
    try:
        # Ищем библиотеку в site-packages
        for site_package in site.getsitepackages():
            test_path = os.path.join(site_package, library_name)
            if os.path.exists(test_path):
                library_path = test_path
                break
        
        # Также проверяем в виртуальном окружении, если оно есть
        if not library_path:
            venv_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath('.'))), '.venv')
            if os.path.exists(venv_path):
                for lib_path in ['Lib', 'lib']:
                    test_path = os.path.join(venv_path, lib_path, 'site-packages', library_name)
                    if os.path.exists(test_path):
                        library_path = test_path
                        break
        
        if library_path:
            print(f"[INFO] Найден {library_name} в: {library_path}")
            # Используем os.walk для поиска всех DLL/so/dylib файлов
            found_files = set()
            for root, dirs, files in os.walk(library_path):
                for file in files:
                    if file.endswith(('.dll', '.so', '.dylib')):
                        full_path = os.path.join(root, file)
                        rel_path = os.path.relpath(root, library_path)
                        if rel_path == '.':
                            target_path = target_prefix
                        else:
                            target_path = os.path.join(target_prefix, rel_path).replace('\\', '/')
                        
                        # Избегаем дублирования
                        file_key = (full_path, target_path)
                        if file_key not in found_files:
                            found_files.add(file_key)
                            binaries.append(file_key)
            
            print(f"[INFO] Найдено {len(binaries)} библиотечных файлов {library_name}")
        else:
            print(f"[WARNING] Не удалось найти папку {library_name}. DLL файлы могут отсутствовать в сборке.")
    except Exception as e:
        print(f"[WARNING] Ошибка при поиске DLL файлов {library_name}: {e}")
        import traceback
        traceback.print_exc()
    
    return binaries

# Ищем DLL файлы из всех необходимых библиотек
neurosdk_binaries.extend(find_library_binaries('neurosdk', 'neurosdk'))
neurosdk_binaries.extend(find_library_binaries('em_st_artifacts', 'em_st_artifacts'))
neurosdk_binaries.extend(find_library_binaries('spectrum_lib', 'spectrum_lib'))

print(f"[INFO] Всего найдено {len(neurosdk_binaries)} библиотечных файлов для включения в сборку")

a = Analysis(
    ['main.py'],
    pathex=[],
    binaries=neurosdk_binaries,
    datas=ui_files,
    hiddenimports=[
        'PyQt6.QtCore',
        'PyQt6.QtGui',
        'PyQt6.QtWidgets',
        'PyQt6.uic',
        'PyQt6.uic.load_ui',
        'pyqtgraph',
        'pyqtgraph.PlotWidget',
        'neurosdk',
        'neurosdk.cmn_types',
        'neurosdk.sensor',
        'em_st_artifacts',
        'em_st_artifacts.emotional_math',
        'pyem_st_artifacts',
        'spectrum_lib',
        'spectrum_lib.spectrum_lib',
        'pyspectrum_lib',
        'neuro_impl.brain_bit_controller',
        'neuro_impl.emotions_bipolar_controller',
        'neuro_impl.emotions_monopolar_controller',
        'neuro_impl.spectrum_controller',
        'neuro_impl.sensor_emulator',
        'neuro_impl.utils',
        'ui.plots',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='BitApp',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=['neurosdk2-x64.dll', 'neurosdk2-x32.dll', 'libneurosdk2.dylib', 
                 'em_st_artifacts-x64.dll', 'em_st_artifacts-x32.dll',
                 'spectrum_lib', 'pyspectrum_lib'],
    runtime_tmpdir=None,
    console=True,  # Показать консоль для отладки (можно изменить на False после проверки)
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=None,  # Можно добавить иконку: icon='path/to/icon.ico'
)

