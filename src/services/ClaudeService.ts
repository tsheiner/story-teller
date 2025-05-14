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

export interface ContextOptions {
  roles: string[];
  personas: string[];
  scenarios: string[];
}

export interface ModelOption {
  id: string;
  name: string;
  description: string;
}

export class ClaudeService {
  // Define available Claude models
  public static readonly AVAILABLE_MODELS: ModelOption[] = [
    { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', description: 'Most powerful model with highest quality' },
    { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet', description: 'Balance of intelligence and speed' },
    { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', description: 'Fastest model, optimized for quick responses' }
  ];

  private roleContext: string = '';
  private personaContext: string = '';
  private scenarioContext: string = '';
  private generalInstructions: string = '';  // New property for general instructions
  private availableRoles: string[] = [];
  private availablePersonas: string[] = [];
  private availableScenarios: string[] = [];
  private selectedModel: string = 'claude-3-opus-20240229'; // Default model
  private isInitialized: boolean = false;
  private initPromise: Promise<void> | null = null;

  // Getter for selected model
  public getSelectedModel(): string {
    return this.selectedModel;
  }

  // Get available roles
  public getAvailableRoles(): string[] {
    return this.availableRoles;
  }

  // Get available personas
  public getAvailablePersonas(): string[] {
    return this.availablePersonas;
  }

  // Get available scenarios
  public getAvailableScenarios(): string[] {
    return this.availableScenarios;
  }

  // Setter for model selection
  public setModel(modelId: string): void {
    if (ClaudeService.AVAILABLE_MODELS.some(model => model.id === modelId)) {
      // Only log if there's an actual change
      if (this.selectedModel !== modelId) {
        const oldModel = ClaudeService.AVAILABLE_MODELS.find(m => m.id === this.selectedModel);
        const newModel = ClaudeService.AVAILABLE_MODELS.find(m => m.id === modelId);
        
        console.log('%c🔄 MODEL CHANGED', 'background: #4b0082; color: white; padding: 4px 8px; border-radius: 4px;');
        console.log(`From: ${oldModel?.name || this.selectedModel}`);
        console.log(`To: ${newModel?.name || modelId}`);
        console.log(`Model ID: ${modelId}`);
      }
      
      this.selectedModel = modelId;
    } else {
      console.error(`Invalid model ID: ${modelId}`);
    }
  }

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
        
        // Load general instructions first (always load these)
        await this.loadGeneralInstructions();
        
        // Load available contexts
        const contexts = await this.loadAvailableContexts();
        
        // Load the specified contexts or defaults
        if (roleName || contexts.roles.length > 0) {
          const roleToLoad = roleName || contexts.roles[0];
          await this.loadRoleContext(roleToLoad);
        }
        
        if (personaName || contexts.personas.length > 0) {
          const personaToLoad = personaName || contexts.personas[0];
          await this.loadPersonaContext(personaToLoad);
        }
        
        if (scenarioName || contexts.scenarios.length > 0) {
          const scenarioToLoad = scenarioName || contexts.scenarios[0];
          await this.loadScenarioContext(scenarioToLoad);
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

  async loadGeneralInstructions() {
    try {
      console.log('ClaudeService: Loading general instructions');
      const response = await fetch('/context/general_instructions.md');
      if (!response.ok) {
        throw new Error(`Failed to load general instructions`);
      }
      this.generalInstructions = await response.text();
      console.log(`Loaded general instructions (${this.generalInstructions.length} chars)`);
      return this.generalInstructions;
    } catch (error) {
      console.error('Error loading general instructions:', error);
      this.generalInstructions = ''; // Reset to empty on error
      return '';
    }
  }

  async loadAvailableContexts(): Promise<ContextOptions> {
    try {
      console.log('Loading available contexts from API...');
      
      // Call the server endpoint to get the list of context files
      const response = await fetch('/api/list-contexts');
      if (!response.ok) {
        throw new Error(`Failed to load context options, status: ${response.status}`);
      }
      
      const options: ContextOptions = await response.json();
      console.log('Loaded context options:', options);
      
      // Update class state
      this.availableRoles = options.roles;
      this.availablePersonas = options.personas;
      this.availableScenarios = options.scenarios;
      
      return options;
    } catch (error) {
      console.error('Error loading available contexts:', error);
      // Fallback to using hardcoded values
      const fallbackOptions: ContextOptions = {
        roles: ['system_manager', 'meraki_expert'],
        personas: ['entry_network_admin', 'network_designer'],
        scenarios: ['high_cpu_load', 'corporate_campus']
      };
      
      console.log('Using fallback values due to error:', fallbackOptions);
      
      this.availableRoles = fallbackOptions.roles;
      this.availablePersonas = fallbackOptions.personas;
      this.availableScenarios = fallbackOptions.scenarios;
      
      return fallbackOptions;
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

  public hasLoadedContexts(): boolean {
    return this.isInitialized && 
           this.roleContext.length > 0 &&
           this.personaContext.length > 0 &&
           this.scenarioContext.length > 0 &&
           this.generalInstructions.length > 0;  // Include general instructions in check
  }

  private buildSystemPrompt(): string {
    // Construct system prompt with all context types
    return `
${this.generalInstructions}

${this.roleContext}

User Persona:
${this.personaContext}

Current Scenario:
${this.scenarioContext}
`;
  }

  async sendMessage(messages: ChatMessage[]): Promise<string> {
    // Make sure context is loaded
    if (!this.isInitialized) {
      console.log('Service not initialized, waiting for initialization...');
      await this.loadContextFiles();
    }

    // Add detailed context logging right before building the system prompt
    console.log("=== CONTEXT CHECK BEFORE SENDING MESSAGE ===");
    console.log("General instructions (first 100 chars):", this.generalInstructions.substring(0, 100));
    console.log("Role context (first 100 chars):", this.roleContext.substring(0, 100));
    console.log("Persona context (first 100 chars):", this.personaContext.substring(0, 100));
    console.log("Scenario context (first 100 chars):", this.scenarioContext.substring(0, 100));
    console.log("================================================");

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
    const generalInstructionsExists = this.generalInstructions && this.generalInstructions.length > 0;
    const roleContextExists = this.roleContext && this.roleContext.length > 0;
    const scenarioContextExists = this.scenarioContext && this.scenarioContext.length > 0;
    const personaContextExists = this.personaContext && this.personaContext.length > 0;
    
    console.log('General instructions exist:', generalInstructionsExists);
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
        role: 'user' as "user", // Explicitly typed
        content: 'Hello'
      }];
    } else {
      apiMessages = messages.map(msg => ({
        role: msg.role as "user" | "assistant", // Explicitly cast to the expected literal types
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
        model: this.selectedModel,
        maxTokens: 1024,
        systemPromptLength: systemPrompt.length,
        messageCount: apiMessages.length,
        // Log the context sources to verify we're using the correct ones
        contextSources: {
          general: this.generalInstructions.substring(0, 30) + '...',
          role: this.roleContext.substring(0, 30) + '...',
          persona: this.personaContext.substring(0, 30) + '...',
          scenario: this.scenarioContext.substring(0, 30) + '...'
        }
      });
      
      console.log('Sending request to Claude API...');
      
      // Enhanced logging to verify model selection is working
      const modelInfo = ClaudeService.AVAILABLE_MODELS.find(m => m.id === this.selectedModel) || 
        { id: this.selectedModel, name: 'Unknown', description: 'Custom model' };
      
      console.log('🔍 USING MODEL: ' + this.selectedModel);
      console.log(`📌 Model details: ${modelInfo.name} - ${modelInfo.description}`);
      console.log(`📊 Request stats: ${apiMessages.length} messages, ${systemPrompt.length} chars in system prompt`);
      
      // Non-streaming implementation kept for fallback
      const response = await anthropic.messages.create({
        model: this.selectedModel,
        max_tokens: 1024,
        system: systemPrompt,
        messages: apiMessages
      });

      console.log('Got response from Claude API');
      const content = response.content[0];
      if ('text' in content) {
        console.log('Response text (truncated):', content.text.substring(0, 100) + '...');
        
        // Log model details from the actual response
        console.log(`%c✅ RESPONSE FROM MODEL: ${response.model}`, 'color: green; font-weight: bold;');
        console.log(`🕒 Response time: ${new Date().toISOString()}`);
        console.log(`💬 Response length: ${content.text.length} characters`);
        
        return content.text;
      }
      throw new Error('Unexpected response format from Claude API');
    } catch (error) {
      console.error('Error calling Claude API:', error);
      console.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
      let errorMessage = 'Unknown error';
      if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = error.message as string;
      }
      return `Error: Unable to get response from Claude API. ${errorMessage}`;
    }
  }
  
  // New method for streaming responses
  async streamMessage(
    messages: ChatMessage[], 
    onChunk: (chunk: string) => void, 
    onComplete: (fullResponse: string) => void
  ): Promise<void> {
    // Make sure context is loaded
    if (!this.isInitialized) {
      console.log('Service not initialized, waiting for initialization...');
      await this.loadContextFiles();
    }

    const systemPrompt = this.buildSystemPrompt();
    
    let apiMessages;
    
    // If messages array is empty, provide a minimal initialization message
    if (messages.length === 0) {
      apiMessages = [{
        role: 'user' as "user",
        content: 'Hello'
      }];
    } else {
      apiMessages = messages.map(msg => ({
        role: msg.role as "user" | "assistant",
        content: msg.content
      }));
    }
    
    try {
      // Check if API key is available
      if (!import.meta.env.VITE_ANTHROPIC_API_KEY) {
        throw new Error('VITE_ANTHROPIC_API_KEY is not defined in environment variables');
      }
      
      console.log('Sending streaming request to Claude API...');
      
      // Enhanced logging to verify model selection is working
      const modelInfo = ClaudeService.AVAILABLE_MODELS.find(m => m.id === this.selectedModel) || 
        { id: this.selectedModel, name: 'Unknown', description: 'Custom model' };
      
      console.log('🔍 STREAMING USING MODEL: ' + this.selectedModel);
      console.log(`📌 Model details: ${modelInfo.name} - ${modelInfo.description}`);
      console.log(`📊 Stream request stats: ${apiMessages.length} messages, ${systemPrompt.length} chars in system prompt`);
      
      // Using the stream method from Anthropic SDK
      const stream = await anthropic.messages.stream({
        model: this.selectedModel,
        max_tokens: 1024,
        system: systemPrompt,
        messages: apiMessages
      });

      let fullResponse = '';
      let responseModel = '';

      // Process each chunk as it arrives
      for await (const chunk of stream) {
        // Capture the model information when available
        if (chunk.type === 'message_start') {
          responseModel = chunk.message.model;
          console.log(`%c🔄 STREAMING FROM MODEL: ${responseModel}`, 'color: blue; font-weight: bold;');
        }
        
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          const textChunk = chunk.delta.text;
          fullResponse += textChunk;
          onChunk(textChunk);
        }
      }
      
      // Handle the full message for post-processing
      console.log('Streaming completed, full response length:', fullResponse.length);
      console.log(`%c✅ COMPLETED STREAMING FROM MODEL: ${responseModel}`, 'color: green; font-weight: bold;');
      console.log(`🕒 Response time: ${new Date().toISOString()}`);
      onComplete(fullResponse);
    } catch (error) {
      console.error('Error in streaming from Claude API:', error);
      let errorMessage = 'Unknown error';
      if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = error.message as string;
      }
      const errorResponse = `Error: Unable to get response from Claude API. ${errorMessage}`;
      onChunk(errorResponse);
      onComplete(errorResponse);
    }
  }
}