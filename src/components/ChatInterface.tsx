import { useState, useRef } from 'react';
import { Container, Form, Button, Spinner } from 'react-bootstrap';
import ReactMarkdown from 'react-markdown';
import styles from './ChatInterface.module.css';
import { ClaudeService, ChatMessage } from '../services/ClaudeService';
import { ChartParserService } from '../services/ChartParserService';
import { WorkspaceUpdateEvent } from './Workspace';

interface ChatInterfaceProps {
  claudeService: ClaudeService;
  onToggleContext: () => void;
  showContext: boolean;
}

export function ChatInterface({ 
  claudeService, 
  onToggleContext, 
  showContext 
}: ChatInterfaceProps) {
  // Messages will reset on page refresh since we're not persisting them
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);


  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    // Save current messages count to determine if this is a new conversation
    const isFirstMessage = messages.length === 0;
    
    // Update state
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    // Reset textarea height after submission
    const textarea = document.querySelector(`.${styles.resizableTextarea}`) as HTMLTextAreaElement;
    if (textarea) {
      textarea.style.height = '38px';
    }
   
    try {
      // Log if this is the first message in the conversation
      console.log('Is first message in conversation:', isFirstMessage);
      
      // Pass messages to Claude service
      const messagesToSend = [...messages, userMessage];
      console.log('Sending', messagesToSend.length, 'messages to Claude');
      
      const response = await claudeService.sendMessage(messagesToSend);
      console.log('Received response from Claude', response.substring(0, 50) + '...');
      
      // Process the response to extract chart commands
      const { processedContent, extractedCharts } = ChartParserService.processMessage(response);
      console.log('Processed Claude response, found', extractedCharts.length, 'charts');
      
      // If charts were found, dispatch events to update the workspace
      if (extractedCharts.length > 0) {
        extractedCharts.forEach(chart => {
          console.log('Dispatching chart to workspace:', chart.title);
          const event = new CustomEvent<WorkspaceUpdateEvent>('workspace-update', {
            detail: {
              type: 'add-chart',
              payload: chart
            }
          });
          window.dispatchEvent(event);
        });
      }
      
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: processedContent, // Use the processed content without chart commands
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
  <div key={index} className={styles.messageWrapper}>
    <div className={msg.role === 'user' ? styles.userMessage : styles.assistantMessage}>
      {msg.role === 'user' ? (
        msg.content
      ) : (
        <ReactMarkdown>{msg.content}</ReactMarkdown>
      )}
    </div>
  </div>
))}
        
        {/* Loading spinner shown while waiting for AI response */}
        {isLoading && (
          <div className={styles.loadingContainer}>
            <Spinner animation="border" role="status" variant="primary" size="sm">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
            <span className={styles.loadingText}>Claude is thinking...</span>
          </div>
        )}
        
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
              target.style.height = `${Math.min(target.scrollHeight, 300)}px`;
            }}
            onFocus={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = '38px';
              target.style.height = `${Math.min(target.scrollHeight, 300)}px`;
            }}
            onBlur={(e) => {
              // Reset height when losing focus if no content
              if (!e.currentTarget.value.trim()) {
                e.currentTarget.style.height = '38px';
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <Button 
            type="submit" 
            variant="primary" 
            disabled={isLoading}
            style={{ 
              backgroundColor: '#007bff', 
              borderColor: '#007bff',
              fontFamily: 'Roboto Mono, monospace',
              fontSize: '11pt',
              padding: '8px 16px'
            }}
          >
            {isLoading ? 'Sending...' : 'Send'}
          </Button>
        </Form.Group>
        
        <Button
          variant="link"
          onClick={onToggleContext}
          className="text-muted"
          style={{
            border: 'none',
            backgroundColor: 'transparent',
            fontSize: '12px',
            padding: '0',
            margin: '0 0 0 12px',
            textAlign: 'left',
            fontFamily: 'Roboto Mono, monospace',
            display: 'block',
            width: 'auto',
            textDecoration: 'none'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.textDecoration = 'underline';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.textDecoration = 'none';
          }}
        >
          {showContext ? 'Hide Context ⌃' : 'Show Context ⌵'}
        </Button>
      </Form>
    </Container>
  );
}