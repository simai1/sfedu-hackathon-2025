# Hack 2025 — BrainBit Analytics

## Стек
- Frontend: React + TypeScript, Vite, Zustand, react-router, ECharts, SCSS modules, react-toastify, lucide-react.
- Backend: FastAPI, SQLAlchemy, Alembic, PostgreSQL, JWT (access/refresh), pydantic.
- Realtime: WebSocket (BrainBit data), custom hooks + Zustand.
- Desktop/SDK: BrainBit samples (websocket клиент и утилиты) в каталоге `BrainBit/`.

## Структура репозитория
- `front/` — веб-клиент (профиль, анализ, графики, отчёты, группы, подписки).
- `back/` — API (auth, токены, pair-токены, пользователи, WebSocket-менеджер), миграции Alembic.
- `BrainBit/` — примеры и утилиты для работы с BrainBit (эмуляторы, SDK, сборки).

## Быстрый старт (Frontend)
```bash
cd front
pnpm install        # или npm install / yarn install
pnpm run dev        # старт dev-сервера Vite
```
- Базовый адрес: http://localhost:5173
- Конфиг API/WS: `src/utils/apiPath.ts` (подставляет протокол/хост автоматически).

## Быстрый старт (Backend)
```bash
cd back
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# указать переменные окружения (пример)
export DATABASE_URL=postgresql+psycopg2://user:pass@localhost:5432/hack2025
export SECRET_KEY=dev-secret

alembic upgrade head   # применить миграции
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
- Основные настройки: `back/app/core/config.py`
- Точки входа: `back/main.py`, роуты в `back/app/adapters/rest/v1/`
- WebSocket: см. `back/app/service/connection_manager.py`

## Pair-токен и WS
- Получение pair-токена: фронтовые хуки `usePairToken` / `useGeneratePairToken`.
- Подключение к WS: `useWebSocket` + `WebSocketManager` (автоподключение при наличии токена).
- Статусы соединения и последние сообщения хранятся в Zustand `websocketStore`.

## Группы и подписки
- Группы (организации): страницы в `front/src/layers/Profile/Pages/Groups/`, хранение в локальном состоянии (моки), адаптировать под API при готовности.
- Подписки: компонент `SubscriptionPlans`; для роли ORGANIZATION показываются корпоративные планы.

## Скрипты (frontend)
- `pnpm run dev` — dev-сервер
- `pnpm run build` — сборка
- `pnpm run lint` — линт

## Скрипты (backend)
- `uvicorn main:app --reload` — dev-сервер
- `alembic upgrade head` — миграции

## Переменные окружения (пример frontend)
- `VITE_API_BASE_URL` — базовый URL API (если нужно переопределить autodetect)
- `VITE_WS_BASE_URL` — базовый URL WebSocket (если нужно переопределить autodetect)

## Тестовые роли
- Роль приходит от бэка (`role: "organization" | "user"` и т.п.) и маппится в enum `Role`.
- ORGANIZATION видит меню с разделом групп и корпоративные планы; USER — без групп.

## Где править стили/темы
- Глобальные переменные и профильные темы: `front/src/assets/styles/colors.scss`
- Темизация профиля через `data-theme` на `Profile`.

## TODO / интеграция
- Подключить реальные API для групп, подписок, смены пароля и т.д. (помечено TODO в коде).
- Связать загрузку видео для групп с бэком и статистикой просмотров.

