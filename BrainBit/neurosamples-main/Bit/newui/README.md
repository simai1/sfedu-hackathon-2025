# Modern UI Design for NeuroDevice Application

This directory contains a modern, minimalist UI design for the NeuroDevice control application, following contemporary design principles with a light theme, soft shadows, and smooth animations.

## Design Principles

- **Light Theme**: Clean white and light gray color palette with blue/turquoise accents
- **Minimalist Style**: Uncluttered interfaces with ample whitespace
- **Large Controls**: Easy-to-interact elements suitable for all users
- **Soft Shadows**: Neumorphic and Material-inspired subtle shadows
- **Smooth Animations**: Transitions and interactive feedback

## Color Scheme

- Primary Background: White (#FFFFFF)
- Secondary Background: Light Gray (#F5F7FA)
- Primary Accent: Blue (#007BFF)
- Secondary Accent: Light Blue (#4DA1FF) and Teal (#20C997)
- Text: Dark Gray (#212529) for primary, Medium Gray (#6C757D) for secondary

## Screens

### 1. Welcome Screen (`WelcomeScreen.ui`)

- Single prominent "Подключить устройство" button centered on screen
- Clean layout with app title header
- Soft shadows and rounded corners for container elements

### 2. Device Search Screen (`DeviceSearchScreen.ui`)

- Search bar for device filtering
- Loading indicator during device discovery
- Device cards showing found devices
- Connection animation when selecting a device
- Status messages for different states:
  - "Поиск устройств…"
  - "Устройства не найдены"
  - "Подключение…"

### 3. Authentication Screen (`AuthenticationScreen.ui`)

- Clear instruction: "Введите токен, полученный с сервера"
- Large, accessible token input field
- "Подтвердить токен" button
- Error messaging for invalid tokens
- Helper text: "Пользователь копирует токен вручную и вставляет сюда"

### 4. Calibration Screen (`CalibrationScreen.ui`)

- Calibration process description
- "Начать калибровку" button
- Progress visualization during calibration
- Completion message: "Калибровка завершена! Теперь можно вернуться к веб-интерфейсу."
- "Вернуться в веб" button after completion

### 5. Main Application Window (`MainApplicationWindow.ui`)

- Shared toolbar with common actions:
  - "Отключить устройство"
  - "Переподключить"
  - "Выйти"
- User menu in top-right corner
- Status bar for system messages
- Stacked widget for switching between screens

## Style Guide

See `STYLE_GUIDE.md` for detailed typography, spacing, component styles, and animation specifications.

## Implementation Notes

All UI files are designed for PyQt/PySide integration:

- Consistent 1024x768 base resolution
- Responsive layouts using Qt's layout managers
- Custom styling via Qt Style Sheets (QSS)
- Proper widget naming for easy programmatic access
- Unicode support for internationalization

## Animation Features

- Button hover and press effects
- Smooth screen transitions
- Loading indicators
- Connection status animations
- Progress visualization during calibration

The design follows modern UI patterns from Material Design, Fluent Design, and CoreUI principles while maintaining a clean, uncluttered aesthetic.
