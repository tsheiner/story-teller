import Anthropic from '@anthropic-ai/sdk';

// Log available environment variables (without revealing full API key if present)
console.log('Environment variables available:', Object.keys(import.meta.env).join(', '));
console.log('API Key available?', !!import.meta.env.VITE_ANTHROPIC_API_KEY);

// Show API key prefix if it exists
if (import.meta.env.VITE_ANTHROPIC_API_KEY) {
  const apiKeyPrefix = import.meta.env.VITE_ANTHROPIC_API_KEY.substring(0, 10) + '...';
  console.log('API Key prefix:', apiKeyPrefix);
} else {
  console.error('VITE_ANTHROPIC_API_KEY is not defined in environment');
}

const anthropic = new Anthropic({
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true
});

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export class ClaudeService {
  private roleContext: string = '';
  private scenarioContext: string = '';
  private isInitialized: boolean = false;
  private initPromise: Promise<void> | null = null;

  constructor() {
    // Start loading context files immediately on instantiation
    // Use a shared promise to prevent multiple simultaneous initializations
    this.initPromise = this.loadContextFiles();
  }

  async loadContextFiles() {
    // If already initialized, return immediately
    if (this.isInitialized) {
      return;
    }
    
    // If another initialization is in progress, wait for it
    if (this.initPromise) {
      return this.initPromise;
    }
    
    // Create a new initialization promise
    this.initPromise = (async () => {
      if (this.isInitialized) return; // Double-check in case of race condition
      
      try {
        console.log('Loading context files from public directory...');
        
        // Use absolute URLs to the public directory to avoid any issues with relative paths
        const roleResponse = await fetch('/context/roles/system_manager.md', {
          headers: {
            'Accept': 'text/plain',
            'Cache-Control': 'no-cache'
          }
        });
        
        const scenarioResponse = await fetch('/context/scenarios/high_cpu_load.md', {
          headers: {
            'Accept': 'text/plain',
            'Cache-Control': 'no-cache'
          }
        });
        
        if (!roleResponse.ok) {
          throw new Error(`Failed to load role context: ${roleResponse.status} ${roleResponse.statusText}`);
        }
        
        if (!scenarioResponse.ok) {
          throw new Error(`Failed to load scenario context: ${scenarioResponse.status} ${scenarioResponse.statusText}`);
        }
        
        this.roleContext = await roleResponse.text();
        this.scenarioContext = await scenarioResponse.text();
        
        // Verify we got markdown, not HTML
        if (this.roleContext.trim().toLowerCase().startsWith('<!doctype') || 
            this.roleContext.trim().toLowerCase().startsWith('<html')) {
          throw new Error('Received HTML instead of markdown for role context');
        }
        
        if (this.scenarioContext.trim().toLowerCase().startsWith('<!doctype') || 
            this.scenarioContext.trim().toLowerCase().startsWith('<html')) {
          throw new Error('Received HTML instead of markdown for scenario context');
        }
        
        console.log('Role context (first 50 chars):', this.roleContext.substring(0, 50));
        console.log('Scenario context (first 50 chars):', this.scenarioContext.substring(0, 50));
        
        this.isInitialized = true;
        console.log('Context files loaded successfully from public directory');
      } catch (error) {
        console.error('Error loading context files:', error);
        this.initPromise = null; // Reset so future attempts can try again
        throw error;
      }
    })(); // Execute the async function and return the promise
    
    return this.initPromise;
  }

  private buildSystemPrompt(): string {
    const chartInstructions = `
Workspace Capabilities:
You can create interactive charts in the workspace panel using the following syntax:

{{chart:TYPE
  title: Chart Title
  xAxis: X-Axis Label
  yAxis: Y-Axis Label
  data: [
    {name: "Series 1", values: [10, 20, 30, 40, 50]},
    {name: "Series 2", values: [15, 25, 35, 45, 55]}
  ]
}}

Chart types available: line, bar, column, pie, area, scatter

Examples:
1. For a line chart showing CPU usage:
{{chart:line
  title: CPU Usage Over Time
  xAxis: Time (minutes)
  yAxis: CPU Usage (%)
  data: [
    {name: "Web Server", values: [65, 72, 78, 85, 92]},
    {name: "Database", values: [42, 48, 53, 60, 65]}
  ]
}}

2. For a bar chart showing memory allocation:
{{chart:bar
  title: Memory Allocation by Service
  xAxis: Services
  yAxis: Memory (GB)
  data: [
    {name: "Allocated", values: [8, 12, 15, 6, 9]},
    {name: "Used", values: [6, 11, 12, 5, 7]}
  ]
}}

Use these charts when presenting data visualizations would be helpful to the user.
`;

    return `${this.roleContext}\n\n${chartInstructions}\n\nCurrent Scenario:\n${this.scenarioContext}`;
  }

  async sendMessage(messages: ChatMessage[]): Promise<string> {
    // Make sure context is loaded
    if (!this.isInitialized) {
      console.log('Service not initialized, waiting for initialization...');
      await this.loadContextFiles();
    }

    const systemPrompt = this.buildSystemPrompt();
    
    // Debug logging for investigation
    console.log('==== DEBUG INFO ====');
    console.log('Service initialized:', this.isInitialized);
    console.log('Message count:', messages.length);
    
    if (messages.length === 0) {
      console.warn('Warning: Empty messages array passed to sendMessage');
    }
    
    if (messages.length > 0) {
      console.log('First message role:', messages[0].role);
      console.log('First message content (truncated):', messages[0].content.substring(0, 100) + '...');
      console.log('Last message role:', messages[messages.length - 1].role);
      console.log('Last message content (truncated):', messages[messages.length - 1].content.substring(0, 100) + '...');
    }
    
    // Check that system prompt is properly formed
    const roleContextExists = this.roleContext && this.roleContext.length > 0;
    const scenarioContextExists = this.scenarioContext && this.scenarioContext.length > 0;
    
    console.log('Role context exists:', roleContextExists);
    console.log('Scenario context exists:', scenarioContextExists);
    console.log('System prompt length:', systemPrompt.length);
    console.log('System prompt first 100 chars:', systemPrompt.substring(0, 100) + '...');
    
    // Special handling for first message or empty array
    let apiMessages;
    
    // If messages array is empty, provide a minimal initialization message
    if (messages.length === 0) {
      console.log('Empty messages array detected, adding initialization message');
      apiMessages = [{
        role: 'user',
        content: 'Hello'
      }];
    } else {
      apiMessages = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
    }
    
    // Check for any common errors in the message format
    console.log('API message count:', apiMessages.length);
    
    try {
      // Check if API key is available
      if (!import.meta.env.VITE_ANTHROPIC_API_KEY) {
        console.error('API key is missing or undefined');
        throw new Error('VITE_ANTHROPIC_API_KEY is not defined in environment variables');
      }
      
      console.log('API configuration:', {
        model: 'claude-3-opus-20240229',
        maxTokens: 1024,
        systemPromptLength: systemPrompt.length,
        messageCount: apiMessages.length
      });
      
      console.log('Sending request to Claude API...');
      const response = await anthropic.messages.create({
        model: 'claude-3-opus-20240229',
        max_tokens: 1024,
        system: systemPrompt,
        messages: apiMessages
      });

      console.log('Got response from Claude API');
      const content = response.content[0];
      if ('text' in content) {
        console.log('Response text (truncated):', content.text.substring(0, 100) + '...');
        return content.text;
      }
      throw new Error('Unexpected response format from Claude API');
    } catch (error) {
      console.error('Error calling Claude API:', error);
      console.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
      return `Error: Unable to get response from Claude API. ${error.message || 'Unknown error'}`;
    }
  }
}