// src/services/CiscoOpenAIService.ts
import { OpenAI } from 'openai';
import { IAIService, ChatMessage, ContextOptions, ModelOption } from './IAIService';

export class CiscoOpenAIService implements IAIService {
  private openaiClient: OpenAI | null = null;
  private accessToken: string = '';
  private tokenExpiryTime: number = 0;
  private clientId: string;
  private clientSecret: string;
  private appKey: string;
  private availableModels: ModelOption[] = [];
  private selectedModelId: string = '';
  
  // Context management (same pattern as ClaudeService)
  private roleContext: string = '';
  private personaContext: string = '';
  private scenarioContext: string = '';
  private generalInstructions: string = '';
  private availableRoles: string[] = [];
  private availablePersonas: string[] = [];
  private availableScenarios: string[] = [];
  private isInitialized: boolean = false;
  private initPromise: Promise<void> | null = null;

  constructor() {
    // Read credentials from environment variables
    this.clientId = import.meta.env.VITE_CISCO_CLIENT_ID || '';
    this.clientSecret = import.meta.env.VITE_CISCO_CLIENT_SECRET || '';
    this.appKey = import.meta.env.VITE_CISCO_APP_KEY || '';
    
    if (!this.clientId || !this.clientSecret || !this.appKey) {
      console.error('Missing Cisco API credentials. Please check your .env file for:');
      console.error('- VITE_CISCO_CLIENT_ID');
      console.error('- VITE_CISCO_CLIENT_SECRET');
      console.error('- VITE_CISCO_APP_KEY');
    }
    
    // Define available models based on the documentation
    this.availableModels = [
      {
        id: 'gpt-4o',
        name: 'GPT-4o',
        description: 'Most advanced model with 120K context'
      },
      {
        id: 'gpt-4o-mini',
        name: 'GPT-4o Mini',
        description: 'Fast and efficient with 120K context'
      }
    ];
    
    this.selectedModelId = this.availableModels[0].id;
    
    // Start loading context files immediately
    this.initPromise = this.loadContextFiles();
  }

  private async getAccessToken(): Promise<string> {
    // Check if token is still valid (with 5 minute buffer)
    const now = Date.now();
    if (this.accessToken && now < this.tokenExpiryTime - (5 * 60 * 1000)) {
      return this.accessToken;
    }

    try {
      console.log('Getting new Cisco API access token...');
      
      // Base64 encode the credentials
      const credentials = btoa(`${this.clientId}:${this.clientSecret}`);
      
      const response = await fetch('https://id.cisco.com/oauth2/default/v1/token', {
        method: 'POST',
        headers: {
          'Accept': '*/*',
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${credentials}`
        },
        body: 'grant_type=client_credentials'
      });

      if (!response.ok) {
        throw new Error(`Failed to get access token: ${response.status} ${response.statusText}`);
      }

      const tokenData = await response.json();
      this.accessToken = tokenData.access_token;
      
      // Tokens expire in 1 hour according to the docs
      this.tokenExpiryTime = now + (60 * 60 * 1000);
      
      console.log('Successfully obtained Cisco API access token');
      return this.accessToken;
    } catch (error) {
      console.error('Error getting Cisco API access token:', error);
      throw error;
    }
  }

  private async ensureClient(): Promise<OpenAI> {
    const token = await this.getAccessToken();
    
    if (!this.openaiClient || this.accessToken !== token) {
      this.openaiClient = new OpenAI({
        apiKey: token,
        baseURL: 'https://chat-ai.cisco.com/openai',
        dangerouslyAllowBrowser: true
      });
    }
    
    return this.openaiClient;
  }

  // Model management
  getAvailableModels(): ModelOption[] {
    return this.availableModels;
  }

  getSelectedModel(): string {
    return this.selectedModelId;
  }

  setModel(modelId: string): void {
    if (this.availableModels.some(model => model.id === modelId)) {
      if (this.selectedModelId !== modelId) {
        const oldModel = this.availableModels.find(m => m.id === this.selectedModelId);
        const newModel = this.availableModels.find(m => m.id === modelId);
        
        console.log('%c🔄 CISCO OPENAI MODEL CHANGED', 'background: #1ba1e2; color: white; padding: 4px 8px; border-radius: 4px;');
        console.log(`From: ${oldModel?.name || this.selectedModelId}`);
        console.log(`To: ${newModel?.name || modelId}`);
      }
      this.selectedModelId = modelId;
    } else {
      console.error(`Invalid Cisco OpenAI model ID: ${modelId}`);
    }
  }

  // Context management (same implementation as ClaudeService)
  getAvailableRoles(): string[] {
    return this.availableRoles;
  }

  getAvailablePersonas(): string[] {
    return this.availablePersonas;
  }

  getAvailableScenarios(): string[] {
    return this.availableScenarios;
  }

  async loadContextFiles(roleName?: string, personaName?: string, scenarioName?: string): Promise<void> {
    if (this.initPromise && !this.isInitialized) {
      await this.initPromise;
    }
    
    this.initPromise = (async () => {
      try {
        console.log('Loading available contexts for Cisco OpenAI...');
        
        await this.loadGeneralInstructions();
        const contexts = await this.loadAvailableContexts();
        
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
        console.log('Cisco OpenAI context files loaded successfully');
      } catch (error) {
        console.error('Error loading context files for Cisco OpenAI:', error);
        this.initPromise = null;
        throw error;
      }
    })();
    
    return this.initPromise;
  }

  async loadGeneralInstructions(): Promise<string> {
    try {
      const response = await fetch('/context/general_instructions.md');
      if (!response.ok) {
        throw new Error(`Failed to load general instructions`);
      }
      this.generalInstructions = await response.text();
      return this.generalInstructions;
    } catch (error) {
      console.error('Error loading general instructions:', error);
      this.generalInstructions = '';
      return '';
    }
  }

  async loadAvailableContexts(): Promise<ContextOptions> {
    try {
      const response = await fetch('/api/list-contexts');
      if (!response.ok) {
        throw new Error(`Failed to load context options, status: ${response.status}`);
      }
      
      const options: ContextOptions = await response.json();
      
      this.availableRoles = options.roles;
      this.availablePersonas = options.personas;
      this.availableScenarios = options.scenarios;
      
      return options;
    } catch (error) {
      console.error('Error loading available contexts:', error);
      const fallbackOptions: ContextOptions = {
        roles: ['system_manager', 'meraki_expert'],
        personas: ['entry_network_admin', 'network_designer'],
        scenarios: ['high_cpu_load', 'corporate_campus']
      };
      
      this.availableRoles = fallbackOptions.roles;
      this.availablePersonas = fallbackOptions.personas;
      this.availableScenarios = fallbackOptions.scenarios;
      
      return fallbackOptions;
    }
  }

  async loadRoleContext(roleName: string): Promise<string> {
    try {
      const response = await fetch(`/context/roles/${roleName}.md`);
      if (!response.ok) {
        throw new Error(`Failed to load role context for ${roleName}`);
      }
      this.roleContext = await response.text();
      this.isInitialized = true;
      return this.roleContext;
    } catch (error) {
      console.error(`Error loading role context for ${roleName}:`, error);
      this.roleContext = '';
      return '';
    }
  }

  async loadPersonaContext(personaName: string): Promise<string> {
    try {
      const response = await fetch(`/context/personas/${personaName}.md`);
      if (!response.ok) {
        throw new Error(`Failed to load persona context for ${personaName}`);
      }
      this.personaContext = await response.text();
      this.isInitialized = true;
      return this.personaContext;
    } catch (error) {
      console.error(`Error loading persona context for ${personaName}:`, error);
      this.personaContext = '';
      return '';
    }
  }

  async loadScenarioContext(scenarioName: string): Promise<string> {
    try {
      const response = await fetch(`/context/scenarios/${scenarioName}.md`);
      if (!response.ok) {
        throw new Error(`Failed to load scenario context for ${scenarioName}`);
      }
      this.scenarioContext = await response.text();
      this.isInitialized = true;
      return this.scenarioContext;
    } catch (error) {
      console.error(`Error loading scenario context for ${scenarioName}:`, error);
      this.scenarioContext = '';
      return '';
    }
  }

  hasLoadedContexts(): boolean {
    return this.isInitialized && 
           this.roleContext.length > 0 &&
           this.personaContext.length > 0 &&
           this.scenarioContext.length > 0 &&
           this.generalInstructions.length > 0;
  }

  private buildSystemPrompt(): string {
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
    if (!this.isInitialized) {
      await this.loadContextFiles();
    }

    const client = await this.ensureClient();
    const systemPrompt = this.buildSystemPrompt();
    
    // Convert our messages format to OpenAI format
    const openaiMessages: any[] = [
      { role: 'system', content: systemPrompt }
    ];
    
    // Add user and assistant messages
    for (const msg of messages) {
      openaiMessages.push({
        role: msg.role,
        content: msg.content
      });
    }

    try {
      console.log(`Sending request to Cisco OpenAI API with model: ${this.selectedModelId}`);
      
      const response = await client.chat.completions.create({
        model: this.selectedModelId,
        messages: openaiMessages,
        user: JSON.stringify({ appkey: this.appKey }),
        stream: false
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content in response');
      }

      console.log(`Received response from Cisco OpenAI (${response.choices[0].message.content?.length} chars)`);
      return content;
    } catch (error) {
      console.error('Error calling Cisco OpenAI API:', error);
      throw error;
    }
  }

  async streamMessage(
    messages: ChatMessage[], 
    onChunk: (chunk: string) => void, 
    onComplete: (fullResponse: string) => void
  ): Promise<void> {
    if (!this.isInitialized) {
      await this.loadContextFiles();
    }

    const client = await this.ensureClient();
    const systemPrompt = this.buildSystemPrompt();
    
    // Convert our messages format to OpenAI format
    const openaiMessages: any[] = [
      { role: 'system', content: systemPrompt }
    ];
    
    // Add user and assistant messages
    for (const msg of messages) {
      openaiMessages.push({
        role: msg.role,
        content: msg.content
      });
    }

    try {
      console.log(`Streaming request to Cisco OpenAI API with model: ${this.selectedModelId}`);
      
      const stream = await client.chat.completions.create({
        model: this.selectedModelId,
        messages: openaiMessages,
        user: JSON.stringify({ appkey: this.appKey }),
        stream: true
      });

      let fullResponse = '';

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          fullResponse += content;
          onChunk(content);
        }
      }

      console.log(`Cisco OpenAI streaming completed (${fullResponse.length} chars)`);
      onComplete(fullResponse);
    } catch (error) {
      console.error('Error streaming from Cisco OpenAI API:', error);
      const errorMessage = `Error: Unable to get response from Cisco OpenAI API. ${error instanceof Error ? error.message : 'Unknown error'}`;
      onChunk(errorMessage);
      onComplete(errorMessage);
    }
  }
}