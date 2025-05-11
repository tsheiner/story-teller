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
  private personaContext: string = '';
  private scenarioContext: string = '';
  private availableRoles: string[] = [];
  private availablePersonas: string[] = [];
  private availableScenarios: string[] = [];
  private isInitialized: boolean = false;
  private initPromise: Promise<void> | null = null;

  constructor() {
    // Start loading context files immediately on instantiation
    this.initPromise = this.loadContextFiles();
  }

  async loadContextFiles(
    roleName?: string,
    personaName?: string,
    scenarioName?: string
  ) {
    // If another initialization is in progress, wait for it
    if (this.initPromise && !this.isInitialized) {
      await this.initPromise;
    }
    
    // Create a new initialization promise
    this.initPromise = (async () => {
      try {
        console.log('Loading available contexts...');
        
        // Load available contexts first
        await this.loadAvailableContexts();
        
        // Load the specified contexts or defaults
        if (roleName || this.availableRoles.length > 0) {
          await this.loadRoleContext(roleName || this.availableRoles[0]);
        }
        
        if (personaName || this.availablePersonas.length > 0) {
          await this.loadPersonaContext(personaName || this.availablePersonas[0]);
        }
        
        if (scenarioName || this.availableScenarios.length > 0) {
          await this.loadScenarioContext(scenarioName || this.availableScenarios[0]);
        }
        
        this.isInitialized = true;
        console.log('Context files loaded successfully');
      } catch (error) {
        console.error('Error loading context files:', error);
        this.initPromise = null; // Reset so future attempts can try again
        throw error;
      }
    })();
    
    return this.initPromise;
  }

  async loadAvailableContexts() {
    try {
      console.log('Loading available contexts...');
      
      // Since the API approach is having issues, use hardcoded values
      // that we know exist based on the file structure we created
      this.availableRoles = ['system_manager', 'meraki_expert'];
      this.availablePersonas = ['entry_network_admin', 'network_designer'];
      this.availableScenarios = ['high_cpu_load', 'corporate_campus'];
      
      console.log('Available roles:', this.availableRoles);
      console.log('Available personas:', this.availablePersonas);
      console.log('Available scenarios:', this.availableScenarios);
      
      return {
        roles: this.availableRoles,
        personas: this.availablePersonas,
        scenarios: this.availableScenarios
      };
    } catch (error) {
      console.error('Error loading available contexts:', error);
      // Fallback to using hardcoded values
      const fallbackRoles = ['system_manager', 'meraki_expert'];
      const fallbackPersonas = ['entry_network_admin', 'network_designer'];
      const fallbackScenarios = ['high_cpu_load', 'corporate_campus'];
      
      console.log('Using fallback values:', {
        roles: fallbackRoles,
        personas: fallbackPersonas,
        scenarios: fallbackScenarios
      });
      
      this.availableRoles = fallbackRoles;
      this.availablePersonas = fallbackPersonas;
      this.availableScenarios = fallbackScenarios;
      
      return { 
        roles: fallbackRoles, 
        personas: fallbackPersonas, 
        scenarios: fallbackScenarios 
      };
    }
  }

  async loadRoleContext(roleName: string) {
    try {
      console.log(`ClaudeService: Loading role context for ${roleName}`);
      const response = await fetch(`/context/roles/${roleName}.md`);
      if (!response.ok) {
        throw new Error(`Failed to load role context for ${roleName}`);
      }
      this.roleContext = await response.text();
      console.log(`Loaded role context for ${roleName} (${this.roleContext.length} chars)`);
      
      // Force reset initialization status so next message will rebuild the system prompt
      this.isInitialized = true;
      console.log('Role context updated, future messages will use new system prompt');
      
      return this.roleContext;
    } catch (error) {
      console.error(`Error loading role context for ${roleName}:`, error);
      this.roleContext = ''; // Reset to empty on error
      return '';
    }
  }

  async loadPersonaContext(personaName: string) {
    try {
      console.log(`ClaudeService: Loading persona context for ${personaName}`);
      const response = await fetch(`/context/personas/${personaName}.md`);
      if (!response.ok) {
        throw new Error(`Failed to load persona context for ${personaName}`);
      }
      this.personaContext = await response.text();
      console.log(`Loaded persona context for ${personaName} (${this.personaContext.length} chars)`);
      
      // Force reset initialization status so next message will rebuild the system prompt
      this.isInitialized = true;
      console.log('Persona context updated, future messages will use new system prompt');
      
      return this.personaContext;
    } catch (error) {
      console.error(`Error loading persona context for ${personaName}:`, error);
      this.personaContext = ''; // Reset to empty on error
      return '';
    }
  }

  async loadScenarioContext(scenarioName: string) {
    try {
      console.log(`ClaudeService: Loading scenario context for ${scenarioName}`);
      const response = await fetch(`/context/scenarios/${scenarioName}.md`);
      if (!response.ok) {
        throw new Error(`Failed to load scenario context for ${scenarioName}`);
      }
      this.scenarioContext = await response.text();
      console.log(`Loaded scenario context for ${scenarioName} (${this.scenarioContext.length} chars)`);
      
      // Force reset initialization status so next message will rebuild the system prompt
      this.isInitialized = true;
      console.log('Scenario context updated, future messages will use new system prompt');
      
      return this.scenarioContext;
    } catch (error) {
      console.error(`Error loading scenario context for ${scenarioName}:`, error);
      this.scenarioContext = ''; // Reset to empty on error
      return '';
    }
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

    // Construct system prompt with all context types
    return `
${this.roleContext}

User Persona:
${this.personaContext}

Current Scenario:
${this.scenarioContext}

${chartInstructions}
`;
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
    const personaContextExists = this.personaContext && this.personaContext.length > 0;
    
    console.log('Role context exists:', roleContextExists);
    console.log('Persona context exists:', personaContextExists);
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
        messageCount: apiMessages.length,
        // Log the context sources to verify we're using the correct ones
        contextSources: {
          role: this.roleContext.substring(0, 30) + '...',
          persona: this.personaContext.substring(0, 30) + '...',
          scenario: this.scenarioContext.substring(0, 30) + '...'
        }
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