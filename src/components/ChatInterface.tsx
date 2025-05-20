import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
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

// Use an interface for the ref to expose methods
export interface ChatInterfaceRef {
  resetConversation: () => void;
}

export const ChatInterface = forwardRef<ChatInterfaceRef, ChatInterfaceProps>(({
  claudeService,
  onToggleContext,
  showContext
}, ref) => {
  // Messages will reset on page refresh since we're not persisting them
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState<ChatMessage | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Function to reset conversation - exposed for context changes
  const resetConversation = () => {
    // Abort any ongoing stream
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // Clear the conversation
    setMessages([]);
    setStreamingMessage(null);
    setIsLoading(false);
    console.log('Conversation has been reset');

    // Clear the workspace by dispatching a clear-workspace event
    const event = new CustomEvent<WorkspaceUpdateEvent>('workspace-update', {
      detail: {
        type: 'clear-workspace'
      }
    });
    window.dispatchEvent(event);
    console.log('Workspace clear event dispatched');
  };

  // Function to stop ongoing stream
  const stopStream = () => {
    if (abortControllerRef.current) {
      console.log('Aborting stream by user request');
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  };

  // Expose methods to parent component via ref
  useImperativeHandle(ref, () => ({
    resetConversation
  }));

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage]);
  
  // Function to handle test context message button
  const handleTestContextMessage = () => {
    const testMessage = "Please introduce yourself according to your role and acknowledge who I am and what situation we're dealing with.";
    handleSubmitMessage(testMessage);
  };

  // Function to handle message submissions programmatically
  const handleSubmitMessage = (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: messageText,
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

    processMessage(userMessage, isFirstMessage);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    handleSubmitMessage(input);
  };

  // Extract core message processing logic for reuse
  const processMessage = async (userMessage: ChatMessage, isFirstMessage: boolean) => {
    try {
      // Create a new abort controller for this request
      if (abortControllerRef.current) {
        // If there's an existing controller, abort it first
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      // Log if this is the first message in the conversation
      console.log('Is first message in conversation:', isFirstMessage);

      // Pass messages to Claude service - we need to get the current state
      // since setMessages may not have updated yet when this executes
      const currentMessages = messages;
      const messagesToSend = [...currentMessages, userMessage];
      console.log('Sending', messagesToSend.length, 'messages to Claude');

      // Initialize empty streaming message
      const initialStreamingMessage: ChatMessage = {
        role: 'assistant',
        content: '',
        timestamp: new Date()
      };
      setStreamingMessage(initialStreamingMessage);

      // Use streaming API with abort controller
      await claudeService.streamMessage(
        messagesToSend,
        // Handle each chunk as it arrives
        (chunk: string) => {
          setStreamingMessage(current => {
            if (!current) return null;
            return {
              ...current,
              content: current.content + chunk
            };
          });
        },
        // Handle complete response
        (fullResponse: string) => {
          console.log('Received complete response from Claude');

          // Clear the abort controller reference since stream is complete
          abortControllerRef.current = null;
          
          // Log the full response to debug table parsing issues
          console.log('=== FULL CLAUDE RESPONSE ===');
          console.log(fullResponse);
          console.log('=== END CLAUDE RESPONSE ===');

          // Process the response to extract chart and table commands
          const { processedContent, extractedCharts } = ChartParserService.processMessage(fullResponse);
          console.log('Processed Claude response, found', extractedCharts.length, 'visualizations');
          console.log('Extracted visualizations:', extractedCharts);
          
          // If visualizations were found, dispatch events to update the workspace
          if (extractedCharts.length > 0) {
            extractedCharts.forEach(visualization => {
              if (visualization.type === 'table') {
                console.log('Dispatching table to workspace:', visualization.title);
                console.log('Table config:', visualization);
                const event = new CustomEvent<WorkspaceUpdateEvent>('workspace-update', {
                  detail: {
                    type: 'add-table',
                    payload: visualization
                  }
                });
                window.dispatchEvent(event);
              } else {
                console.log('Dispatching chart to workspace:', visualization.title);
                const event = new CustomEvent<WorkspaceUpdateEvent>('workspace-update', {
                  detail: {
                    type: 'add-chart',
                    payload: visualization
                  }
                });
                window.dispatchEvent(event);
              }
            });
          } else {
            console.log('No visualizations found in Claude response');
          }
          
          // Add the complete message to the chat history and clear streaming message
          const assistantMessage: ChatMessage = {
            role: 'assistant',
            content: processedContent, // Use the processed content without chart commands
            timestamp: new Date()
          };

          setMessages(prev => [...prev, assistantMessage]);
          setStreamingMessage(null);
          setIsLoading(false);
        }
      ,
        // Pass the abort signal
        abortControllerRef.current.signal
      );
    } catch (error) {
      console.error('Error getting response:', error);
      setStreamingMessage(null);
      setIsLoading(false);
      // Clear abort controller on error
      abortControllerRef.current = null;
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
      
      {/* Streaming message */}
      {streamingMessage && (
        <div className={styles.messageWrapper}>
          <div className={styles.assistantMessage}>
            <ReactMarkdown>{streamingMessage.content}</ReactMarkdown>
          </div>
        </div>
      )}
        
      {/* Loading spinner shown while waiting for AI response to start */}
      {isLoading && !streamingMessage && (
        <div className={styles.loadingContainer}>
          <Spinner animation="border" role="status" variant="primary" size="sm">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <span className={styles.loadingText}>Thinking...</span>
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
            disabled={isLoading && !streamingMessage}
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
                // If streaming, stop the stream; otherwise submit the form
                if (streamingMessage) {
                  stopStream();
                } else {
                  handleSubmit(e);
                }
              }
            }}
          />
          <Button
            type={streamingMessage ? "button" : "submit"}
            variant={streamingMessage ? "secondary" : "primary"}
            onClick={streamingMessage ? stopStream : undefined}
            style={{
              backgroundColor: streamingMessage ? '#6c757d' : '#007bff',
              borderColor: streamingMessage ? '#6c757d' : '#007bff',
              color: '#ffffff', // Maintain high contrast with white text
              fontFamily: 'Roboto Mono, monospace',
              fontSize: '11pt',
              padding: '8px 16px'
            }}
          >
            {streamingMessage ? 'Stop' : isLoading && !streamingMessage ? 'Sending...' : 'Send'}
          </Button>
        </Form.Group>
        
        <div className="d-flex align-items-center">
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

          <Button
            variant="outline-secondary"
            size="sm"
            onClick={resetConversation}
            className="mt-2 ms-3"
          >
            New Conversation
          </Button>

          <Button
            variant="outline-info"
            size="sm"
            onClick={handleTestContextMessage}
            className="ms-2 mt-2"
          >
            Test Context
          </Button>
        </div>
      </Form>
    </Container>
  );
});