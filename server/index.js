require('dotenv').config();
const express = require('express');
const cors = require('cors');
const aiService = require('./services/ai-service');

const app = express();

// Настройка CORS для GitHub Pages и локальной разработки
app.use(cors({
  origin: [
    'https://your-username.github.io',
    'http://localhost:5173',
    'http://localhost:3000'
  ],
  methods: ['GET', 'POST'],
  credentials: true
}));
app.use(express.json());

app.post('/api/chat', async (req, res) => {
    try {
        const { message, chatId, isSystemMessage, currentChatName } = req.body;

        // Формируем сообщения для API
        const messages = isSystemMessage ? [
            { 
                role: 'system', 
                content: currentChatName 
                    ? 'Ты должен решить, нужно ли изменить текущее название чата. Текущее название: ' + currentChatName + '. Если текущее название хорошо отражает суть беседы - оставь его. Если можешь предложить более подходящее - предложи новое. Ответь строго в формате "ОСТАВИТЬ: текущее_название" или "ИЗМЕНИТЬ: новое_название".'
                    : 'Придумай короткое название для чата (не более 4-5 слов). Ответь в формате "ИЗМЕНИТЬ: название".'
            },
            { role: 'user', content: message }
        ] : [{ role: 'user', content: message }];

        // Используем сервис для обработки сообщений
        const response = await aiService.chat(messages, 'openai', chatId, isSystemMessage);
        res.json(response);

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Something went wrong', details: error.message });
    }
});

// Эндпоинт для получения истории сообщений thread
app.get('/api/chat/history/:threadId', async (req, res) => {
    try {
        const { threadId } = req.params;
        const messages = await aiService.getThreadMessages(threadId);
        res.json(messages);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to fetch chat history' });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 