import { useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import rehypeRaw from 'rehype-raw'
import remarkGfm from 'remark-gfm'
import '../styles/App.css'
import 'highlight.js/styles/github-dark.css'
import { useTelegram } from '../hooks/useTelegram'

function App() {
  const { tg } = useTelegram();
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

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    if (!tg) {
      console.error('Telegram WebApp is not available');
      return;
    }

    tg.ready();
    
    document.body.style.backgroundColor = tg.backgroundColor;

    const savedHistory = localStorage.getItem('chatHistory');
    if (savedHistory) {
      const history = JSON.parse(savedHistory);
      setChatHistory(history);
      
      if (!currentChatId && history.length > 0) {
        const lastChat = history[history.length - 1];
        setCurrentChatId(lastChat.id);
        setMessages(lastChat.messages);
      }
    } else {
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
  }, []);

  const createNewChat = () => {
    const newChat = {
      id: Date.now(),
      name: 'Новый чат',
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
    console.log('Loading started:', isLoading);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/chat`, {
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
      console.log('Response received');
      
      if (response.ok) {
        const assistantMessage = { role: 'assistant', content: data.reply };
        const newMessages = [...updatedMessages, assistantMessage];
        setMessages(newMessages);

        if (currentChatId) {
          setChatHistory(prev => {
            const updated = prev.map(chat => {
              if (chat.id === currentChatId) {
                let newName = chat.name;
                if (newMessages.length === 3) {
                  newName = userMessage.content.slice(0, 30) + (userMessage.content.length > 30 ? '...' : '');
                } else if (newMessages.length === 5) {
                  const firstUserMessage = newMessages.find(m => m.role === 'user');
                  if (firstUserMessage) {
                    newName = firstUserMessage.content.slice(0, 30) + (firstUserMessage.content.length > 30 ? '...' : '');
                  }
                }

                return { 
                  ...chat, 
                  messages: newMessages,
                  threadId: data.threadId,
                  name: newName
                };
              }
              return chat;
            });
            localStorage.setItem('chatHistory', JSON.stringify(updated));
            return updated;
          });
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
      console.log('Loading finished:', isLoading);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="app-container">
      <div className={`chat-container ${isSidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="chat-header">
          <button className="history-button" onClick={toggleSidebar}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="header-info">
            <div className="name">Einstein</div>
          </div>
        </div>

        <div className={`sidebar-overlay ${isSidebarOpen ? 'visible' : ''}`} onClick={toggleSidebar}></div>
        
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
          <button className="subscription-btn" disabled>
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
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}
        </div>

        <div className="input-container">
          <form onSubmit={handleSubmit} className={`input-form ${isLoading ? 'loading' : ''}`}>
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
  );
}

export default App; 