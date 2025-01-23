import { useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import rehypeRaw from 'rehype-raw'
import remarkGfm from 'remark-gfm'
import './App.css'
import 'highlight.js/styles/github-dark.css'

// Получаем WebApp из глобального объекта Telegram
const tg = window.Telegram?.WebApp;

function App() {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const messagesContainerRef = useRef(null);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  // Добавляем useEffect для прокрутки при изменении сообщений или статуса загрузки
  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    // Добавляем проверку на существование tg
    if (!tg) {
      console.error('Telegram WebApp is not available');
      return;
    }

    // Инициализируем Telegram WebApp
    tg.ready();
    
    // Устанавливаем основной цвет из темы Telegram
    document.body.style.backgroundColor = tg.backgroundColor;

    // Загружаем историю чатов
    const savedHistory = localStorage.getItem('chatHistory');
    if (savedHistory) {
      const history = JSON.parse(savedHistory);
      setChatHistory(history);
      
      // Если есть история, но нет активного чата, открываем последний
      if (!currentChatId && history.length > 0) {
        const lastChat = history[history.length - 1];
        setCurrentChatId(lastChat.id);
        setMessages(lastChat.messages);
      }
    } else {
      // Если истории нет, создаем первый чат с приветственным сообщением
      const initialMessage = {
        role: 'assistant',
        content: 'Hi, how are you?\n\nI\'m here to help with any questions. What would you like to ask?'
      };
      const firstChat = {
        id: Date.now(),
        name: 'Новый чат',
        messages: [initialMessage]
      };
      setChatHistory([firstChat]);
      setCurrentChatId(firstChat.id);
      setMessages([initialMessage]);
      localStorage.setItem('chatHistory', JSON.stringify([firstChat]));
    }

    // Настраиваем кнопку "Назад" в хедере Telegram
    tg.BackButton.onClick(() => {
      if (currentChatId) {
        setCurrentChatId(null);
        setMessages([]);
        tg.BackButton.hide();
      }
    });
  }, []);

  // Обновляем useEffect для currentChatId
  useEffect(() => {
    if (currentChatId) {
      tg.BackButton.show();
    } else {
      tg.BackButton.hide();
    }
  }, [currentChatId]);

  const createNewChat = () => {
    const newChat = {
      id: Date.now(),
      name: 'Новый чат',  // Временное название
      messages: []
    };
    setChatHistory(prev => {
      const updatedHistory = [...prev, newChat];
      localStorage.setItem('chatHistory', JSON.stringify(updatedHistory));
      return updatedHistory;
    });
    setCurrentChatId(newChat.id);
    setMessages([]);
  };

  const updateChatName = async (chatId, assistantResponses) => {
    try {
      const response = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: `Проанализируй эту переписку и реши, нужно ли изменить текущее название чата. Если нужно - предложи новое название (не более 4-5 слов). Ответь в формате: "ОСТАВИТЬ: текущее_название" или "ИЗМЕНИТЬ: новое_название". Вот содержание переписки: "${assistantResponses}"`,
          isSystemMessage: true,
          currentChatName: chatHistory.find(c => c.id === chatId)?.name
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        const [action, name] = data.reply.split(': ');
        
        if (action === 'ИЗМЕНИТЬ') {
          setChatHistory(prev => {
            const updated = prev.map(chat => {
              if (chat.id === chatId) {
                return { ...chat, name: name.replace(/["']/g, '') };
              }
              return chat;
            });
            localStorage.setItem('chatHistory', JSON.stringify(updated));
            return updated;
          });
        }
      }
    } catch (error) {
      console.error('Error generating chat name:', error);
    }
  };

  const selectChat = (chatId) => {
    const chat = chatHistory.find(c => c.id === chatId);
    if (chat) {
      setCurrentChatId(chatId);
      setMessages(chat.messages);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage = { role: 'user', content: inputValue };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: inputValue,
          chatId: currentChatId 
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        const assistantMessage = { role: 'assistant', content: data.reply };
        const newMessages = [...updatedMessages, assistantMessage];
        setMessages(newMessages);

        // Обновляем историю чатов
        if (currentChatId) {
          setChatHistory(prev => {
            const updated = prev.map(chat => {
              if (chat.id === currentChatId) {
                return { 
                  ...chat, 
                  messages: newMessages,
                  threadId: data.threadId // Сохраняем threadId
                };
              }
              return chat;
            });
            localStorage.setItem('chatHistory', JSON.stringify(updated));
            return updated;
          });

          // Генерируем название после второго ответа
          if (newMessages.length === 4) {
            const firstResponse = newMessages[1].content;
            const secondResponse = newMessages[3].content;
            await updateChatName(currentChatId, `${firstResponse} ${secondResponse}`);
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="app-container" style={{ height: tg?.viewportHeight || '100vh' }}>
      <div className="chat-container">
        <div className="chat-header">
          <button className="history-button" onClick={toggleSidebar}>
            <svg 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                d="M3 12h18M3 6h18M3 18h18" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round"
              />
            </svg>
          </button>
          <div className="header-info">
            <div className="name">Einstein</div>
          </div>
        </div>

        {isSidebarOpen && (
          <div className="sidebar-overlay" onClick={toggleSidebar}></div>
        )}

        <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
          <button className="new-chat-btn" onClick={createNewChat}>
            Новый чат
          </button>
          <div className="chat-history">
            {chatHistory.map((chat) => (
              <div
                key={chat.id}
                className={`chat-item ${chat.id === currentChatId ? 'active' : ''}`}
                onClick={() => selectChat(chat.id)}
              >
                {chat.name}
              </div>
            ))}
          </div>
          <button className="subscription-btn" onClick={() => tg.openInvoice('your_invoice_url')}>
            Подписка
          </button>
        </div>

        <div className="messages-container" ref={messagesContainerRef}>
          {messages.map((message, index) => (
            <div key={index} className={`message ${message.role}`}>
              <div className="message-content">
                {message.role === 'user' ? (
                  message.content
                ) : (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw, rehypeHighlight]}
                    components={{
                      pre: ({ node, ...props }) => (
                        <div className="code-block-wrapper">
                          <pre {...props} />
                        </div>
                      ),
                      code: ({ node, inline, ...props }) => (
                        inline ? 
                          <code className="inline-code" {...props} /> :
                          <code {...props} />
                      ),
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="message assistant">
              <div className="message-content typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}
        </div>

        <div className="input-container">
          <form onSubmit={handleSubmit} className="input-form">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="ask Einstein a question?"
              disabled={isLoading}
            />
            <button type="submit" disabled={isLoading} className="send-button">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22 2L11 13M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default App 