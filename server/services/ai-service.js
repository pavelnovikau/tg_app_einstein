const OpenAI = require('openai');
const axios = require('axios');
const config = require('../config/prompts');

class AIService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    this.deepseekConfig = {
      baseURL: 'https://api.deepseek.com/v1',
      headers: {
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json'
      }
    };

    // Хранилище для thread_ids
    this.threadStore = new Map();

    // Проверяем наличие ID ассистента
    if (!process.env.OPENAI_ASSISTANT_ID) {
      console.error('OPENAI_ASSISTANT_ID is not set in environment variables');
    }
  }

  async getThreadMessages(threadId) {
    try {
      const messages = await this.openai.beta.threads.messages.list(threadId);
      return messages.data;
    } catch (error) {
      console.error('Error fetching thread messages:', error);
      throw error;
    }
  }

  async chatOpenAI(messages, isSystemMessage = false, chatId = null) {
    try {
      // Если это системное сообщение (например, для именования чата),
      // используем обычный chat completion
      if (isSystemMessage) {
        const completion = await this.openai.chat.completions.create({
          model: config.openai.model,
          messages: messages,
          ...config.openai.settings
        });
        return {
          reply: completion.choices[0].message.content,
          threadId: null
        };
      }

      // Проверяем наличие ID ассистента
      const assistantId = process.env.OPENAI_ASSISTANT_ID;
      if (!assistantId) {
        throw new Error('OPENAI_ASSISTANT_ID is not configured');
      }

      // Получаем или создаем thread для чата
      let threadId = this.threadStore.get(chatId);
      if (!threadId) {
        const thread = await this.openai.beta.threads.create();
        threadId = thread.id;
        this.threadStore.set(chatId, threadId);
      }

      // Добавляем сообщение пользователя в тред
      const lastMessage = messages[messages.length - 1];
      await this.openai.beta.threads.messages.create(threadId, {
        role: 'user',
        content: lastMessage.content
      });

      // Запускаем ассистента
      const run = await this.openai.beta.threads.runs.create(threadId, {
        assistant_id: assistantId
      });

      // Ждем завершения выполнения
      let runStatus = await this.openai.beta.threads.runs.retrieve(threadId, run.id);
      while (runStatus.status !== 'completed') {
        await new Promise(resolve => setTimeout(resolve, 1000));
        runStatus = await this.openai.beta.threads.runs.retrieve(threadId, run.id);
        
        if (runStatus.status === 'failed') {
          throw new Error('Assistant run failed');
        }
      }

      // Получаем сообщения из треда
      const threadMessages = await this.openai.beta.threads.messages.list(threadId);
      const lastAssistantMessage = threadMessages.data
        .filter(msg => msg.role === 'assistant')
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];

      return {
        reply: lastAssistantMessage.content[0].text.value,
        threadId: threadId
      };
    } catch (error) {
      console.error('OpenAI API Error:', error);
      return {
        reply: config.openai.prompts.error,
        threadId: null
      };
    }
  }

  async chatDeepseek(messages, isSystemMessage = false) {
    try {
      const formattedMessages = messages.map(msg => ({
        role: msg.role === 'system' ? 'assistant' : msg.role,
        content: msg.content
      }));

      if (!isSystemMessage && (!formattedMessages.length || !formattedMessages.some(msg => msg.role === 'assistant'))) {
        formattedMessages.unshift({
          role: 'assistant',
          content: config.deepseek.prompts.system
        });
      }

      const payload = {
        model: config.deepseek.model,
        messages: formattedMessages,
        ...config.deepseek.settings
      };

      const response = await axios.post('https://api.deepseek.com/v1/chat/completions', payload, {
        headers: this.deepseekConfig.headers
      });

      return {
        reply: response.data.choices[0].message.content,
        threadId: response.data.id
      };
    } catch (error) {
      console.error('Deepseek API Error:', error.response?.data || error.message);
      return {
        reply: config.deepseek.prompts.error,
        threadId: null
      };
    }
  }

  async chat(messages, model = 'deepseek', threadId = null, isSystemMessage = false) {
    switch (model.toLowerCase()) {
      case 'openai':
        return this.chatOpenAI(messages, isSystemMessage, threadId);
      case 'deepseek':
        return this.chatDeepseek(messages, isSystemMessage);
      default:
        throw new Error(`Unsupported model: ${model}`);
    }
  }
}

module.exports = new AIService(); 