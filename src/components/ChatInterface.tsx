import { useState, useRef, useEffect } from 'react';
import { Container, Form, Button } from 'react-bootstrap';
import styles from './ChatInterface.module.css';
import { ClaudeService, ChatMessage } from '../services/ClaudeService';

export function ChatInterface() {
  // Messages will reset on page refresh since we're not persisting them
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const claudeService = useRef(new ClaudeService());
  
  // Added for debugging
  const isFirstRender = useRef(true);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Add debug component for first message and setup context
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      console.log('First render of ChatInterface');
      
      // Initialize Claude service
      (async () => {
        try {
          await claudeService.current.loadContextFiles();
          console.log('Context files loaded successfully');
        } catch (error) {
          console.error('Failed to load context files:', error);
        }
      })();
    }
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Check if this is the first message in the conversation
      const isFirstMessage = messages.length === 0;
      console.log('Is first message in conversation:', isFirstMessage);
      
      // Pass messages to Claude service
      const messagesToSend = [...messages, userMessage];
      console.log('Sending', messagesToSend.length, 'messages to Claude');
      
      const response = await claudeService.current.sendMessage(messagesToSend);
      console.log('Received response from Claude', response.substring(0, 50) + '...');
      
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error getting response:', error);
      // You might want to show an error message to the user here
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container className={`d-flex flex-column ${styles.chatContainer}`}>
      <div className={`flex-grow-1 overflow-auto mb-3 ${styles.messageContainer}`}>
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`d-flex ${msg.role === 'user' ? 'justify-content-end' : 'justify-content-start'} mb-3`}
          >
            <div className={`${styles.messageWrapper} ${msg.role === 'user' ? styles.userMessage : styles.assistantMessage}`}>
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <Form onSubmit={handleSubmit} className="mt-auto">
        <Form.Group className="d-flex gap-2">
          <Form.Control
            as="textarea"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            autoComplete="off"
            disabled={isLoading}
            className={styles.resizableTextarea}
            style={{ height: '38px', maxHeight: '300px' }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = '38px';
              target.style.height = `${target.scrollHeight}px`;
            }}
            onFocus={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = '38px';
              target.style.height = `${target.scrollHeight}px`;
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <Button type="submit" variant="primary" disabled={isLoading}>
            {isLoading ? 'Sending...' : 'Send'}
          </Button>
        </Form.Group>
      </Form>
    </Container>
  );
}