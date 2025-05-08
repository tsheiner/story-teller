import { useState, useRef, useEffect } from 'react';
import { Container, Form, Button, Spinner } from 'react-bootstrap';
import ReactMarkdown from 'react-markdown';
import styles from './ChatInterface.module.css';
import { ClaudeService, ChatMessage } from '../services/ClaudeService';
import { ChartParserService } from '../services/ChartParserService';
import { WorkspaceUpdateEvent } from './Workspace';

export function ChatInterface() {
  // Messages will reset on page refresh since we're not persisting them
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const claudeService = useRef(new ClaudeService());
  
  // Added for debugging
  const isFirstRender = useRef(true);

  // Create a ref for the latest user message
  const latestUserMessageRef = useRef<HTMLDivElement>(null);
  // Track when user is manually scrolling
  const [userIsScrolling, setUserIsScrolling] = useState(false);
  // Track if we've already scrolled to the latest message
  const hasScrolledToLatestMessage = useRef(false);
  // Track the last processed message count to detect new messages
  const lastMessageCount = useRef(0);
  
  // Scroll to bottom of chat
  const scrollToBottom = () => {
    if (!userIsScrolling) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };
  
  // Scroll to position the latest user message at the top of the visible area
  const scrollToLatestUserMessage = () => {
    if (latestUserMessageRef.current && !userIsScrolling) {
      console.log('Executing scroll to position message at top');
      
      // Force immediate scroll with 'auto' behavior
      latestUserMessageRef.current.scrollIntoView({ 
        behavior: "auto",  // Use "auto" for immediate scrolling
        block: "start"     // Position at top
      });
      
      // Mark as scrolled to avoid duplicate scrolling
      hasScrolledToLatestMessage.current = true;
      
      // Log scroll completed
      console.log('Scroll completed');
    } else {
      console.log('Could not scroll - ref missing or user scrolling');
    }
  };

  // Track when user manually scrolls
  useEffect(() => {
    const handleUserScroll = () => {
      setUserIsScrolling(true);
      
      // Reset after 2 seconds of no scrolling
      const timer = setTimeout(() => {
        setUserIsScrolling(false);
      }, 2000);
      
      return () => clearTimeout(timer);
    };
    
    const container = document.querySelector(`.${styles.messageContainer}`);
    if (container) {
      container.addEventListener('scroll', handleUserScroll);
      return () => container.removeEventListener('scroll', handleUserScroll);
    }
  }, []);

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
  }, []);
  
  // Handle new messages and scrolling
  useEffect(() => {
    // Log state for debugging
    console.log('Messages or loading state changed:', {
      messageCount: messages.length,
      lastCount: lastMessageCount.current,
      isLoading,
      hasScrolled: hasScrolledToLatestMessage.current
    });
    
    // We have a new user message if:
    // 1. Message count increased
    // 2. We're now in loading state (waiting for AI)
    // 3. Last message is from user
    const hasNewUserMessage = 
      messages.length > lastMessageCount.current && 
      isLoading && 
      messages.length > 0 && 
      messages[messages.length - 1].role === 'user';
    
    // Update last message count
    lastMessageCount.current = messages.length;
    
    if (hasNewUserMessage) {
      console.log('New user message detected - scrolling to position it at top');
      // Reset scroll flag 
      hasScrolledToLatestMessage.current = false;
      
      // Small timeout to ensure the DOM has updated
      setTimeout(() => {
        scrollToLatestUserMessage();
        hasScrolledToLatestMessage.current = true;
      }, 50);
    }
  }, [messages, isLoading]);

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
    
    // Reset the scrolled flag to ensure we scroll to the new message
    hasScrolledToLatestMessage.current = false;
    
    // Log for debugging
    console.log('Message submitted, reset scroll flag. isFirstMessage:', isFirstMessage);

    try {
      // Log if this is the first message in the conversation
      console.log('Is first message in conversation:', isFirstMessage);
      
      // Pass messages to Claude service
      const messagesToSend = [...messages, userMessage];
      console.log('Sending', messagesToSend.length, 'messages to Claude');
      
      const response = await claudeService.current.sendMessage(messagesToSend);
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
        {messages.map((msg, index) => {
          // Check if this is the latest user message
          const isLatestUserMessage = 
            msg.role === 'user' && 
            index === messages.length - (isLoading ? 1 : 2);
          
          return (
            <div
              key={index}
              className={styles.messageWrapper}
              ref={isLatestUserMessage ? latestUserMessageRef : undefined}
            >
              <div className={msg.role === 'user' ? styles.userMessage : styles.assistantMessage}>
                {msg.role === 'user' ? (
                  msg.content
                ) : (
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                )}
              </div>
            </div>
          );
        })}
        
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
      </Form>
    </Container>
  );
}