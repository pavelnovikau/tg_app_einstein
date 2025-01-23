# Einstein Chat - Telegram Mini App

## Проект
Telegram Mini App для общения с AI-ассистентом в стиле Эйнштейна. Использует OpenAI Assistant API для генерации ответов.

## Структура проекта
```
├── src/                  # Frontend (React + Vite)
│   ├── App.jsx          # Основной компонент
│   └── App.css          # Стили
├── server/              # Backend (Node.js + Express)
│   ├── services/        # Сервисы
│   ├── config/         # Конфигурации
│   └── index.js        # Точка входа сервера
```

## Ключевые особенности

### Frontend
- React + Vite
- Telegram WebApp API интеграция
- Поддержка Markdown в сообщениях
- Адаптивный дизайн
- История чатов с автоматическим именованием
- Боковая панель с историей чатов
- Шрифт Lato для улучшенной типографики

### Backend
- Express.js сервер
- OpenAI Assistant API интеграция
- Поддержка DeepSeek API как альтернативы
- Система тредов для сохранения контекста
- Автоматическое именование чатов

## Конфигурация

### Переменные окружения
```env
TELEGRAM_TOKEN=your_telegram_bot_token
OPENAI_API_KEY=your_openai_api_key
OPENAI_ASSISTANT_ID=your_assistant_id
MODEL_NAME=gpt-4o-mini
```

### OpenAI Assistant
- Используется предварительно настроенный ассистент
- Системный промпт стилизован под Эйнштейна
- Поддерживает многоязычность
- Отвечает простым языком

## История разработки

### Что было сделано
1. Базовая структура приложения
2. Интеграция с Telegram WebApp
3. Добавление истории чатов
4. Реализация автоматического именования чатов
5. Интеграция OpenAI Assistant API
6. Добавление DeepSeek как альтернативы
7. Улучшение UI/UX
8. Оптимизация стилей и анимаций
9. Настройка деплоя

### Проблемы и решения
1. Дублирование приветственного сообщения
   - Решено удалением статического сообщения из JSX
2. Проблемы с прокруткой чата
   - Добавлен автоскролл при новых сообщениях
3. Рамки на иконках
   - Исправлены стили кнопок
4. Проблемы с контекстом в чате
   - Реализована система тредов

## Деплой

### GitHub Pages (Frontend)
1. Настроен GitHub Actions workflow
2. Base path в Vite конфигурации
3. Автоматический деплой при пуше в main

### Render (Backend)
1. Настроен render.yaml
2. Установлены переменные окружения
3. Настроен CORS для GitHub Pages

## Тестирование
1. Локально:
   ```bash
   # Frontend
   npm run dev
   
   # Backend
   cd server
   npm run dev
   ```

2. Telegram Mini App:
   - Создать бота через @BotFather
   - Настроить меню с WebApp URL
   - URL формат: `https://t.me/bot_username/app?startapp=your_webapp_url`

## Улучшения для будущих версий
1. Добавить поддержку изображений
2. Реализовать систему подписок
3. Добавить кэширование ответов
4. Улучшить систему именования чатов
5. Добавить поддержку голосовых сообщений

## Зависимости
### Frontend
- React
- Vite
- ReactMarkdown
- highlight.js

### Backend
- Express
- OpenAI Node SDK
- CORS
- dotenv

## Полезные ссылки
- [Telegram Mini Apps Documentation](https://core.telegram.org/bots/webapps)
- [OpenAI Assistants API](https://platform.openai.com/docs/assistants/overview)
- [Render Documentation](https://render.com/docs)
- [GitHub Pages Documentation](https://docs.github.com/en/pages) 