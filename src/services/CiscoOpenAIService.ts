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
    
    console.log('Cisco OpenAI Service initialized with:');
    console.log('- Client ID present:', !!this.clientId);
    console.log('- Client Secret present:', !!this.clientSecret);
    console.log('- App Key present:', !!this.appKey);
    
    // More detailed credential logging for debugging
    if (this.clientId) {
      console.log('- Client ID (first 8 chars):', this.clientId.substring(0, 8) + '...');
    }
    if (this.clientSecret) {
      console.log('- Client Secret (first 8 chars):', this.clientSecret.substring(0, 8) + '...');
    }
    if (this.appKey) {
      console.log('- App Key (first 8 chars):', this.appKey.substring(0, 8) + '...');
    }
    
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
      console.log('Using existing valid token');
      return this.accessToken;
    }

    try {
      console.log('Getting new Cisco API access token...');
      
      // Base64 encode the credentials - exactly like the Python code
      const credentials = btoa(`${this.clientId}:${this.clientSecret}`);
      console.log('Credentials encoded, making token request...');
      console.log('Request URL: https://id.cisco.com/oauth2/default/v1/token');
      console.log('Client ID being used:', this.clientId.substring(0, 8) + '...');
      
      const requestBody = 'grant_type=client_credentials';
      const requestHeaders = {
        'Accept': '*/*',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`
      };
      
      console.log('Request headers:', {
        'Accept': requestHeaders.Accept,
        'Content-Type': requestHeaders['Content-Type'],
        'Authorization': 'Basic [REDACTED]'
      });
      console.log('Request body:', requestBody);
      
      const response = await fetch('https://id.cisco.com/oauth2/default/v1/token', {
        method: 'POST',
        headers: requestHeaders,
        body: requestBody
      });

      console.log('Token response status:', response.status);
      console.log('Token response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Token response error:', errorText);
        console.error('Full response object:', response);
        
        // Try to parse error as JSON for more details
        try {
          const errorJson = JSON.parse(errorText);
          console.error('Parsed error JSON:', errorJson);
        } catch (parseError) {
          console.error('Could not parse error as JSON');
        }
        
        throw new Error(`Failed to get access token: ${response.status} ${response.statusText}. Response: ${errorText}`);
      }

      const tokenData = await response.json();
      console.log('Token response received');
      console.log('Token data keys:', Object.keys(tokenData));
      console.log('Expires in:', tokenData.expires_in);
      
      this.accessToken = tokenData.access_token;
      
      // Use the actual expiration time from the response if available
      const expiresIn = tokenData.expires_in || 3600; // default to 1 hour
      this.tokenExpiryTime = now + (expiresIn * 1000);
      
      console.log('Successfully obtained Cisco API access token');
      return this.accessToken;
    } catch (error) {
      console.error('Error getting Cisco API access token:', error);
      
      // Log more details about the error
      if (error instanceof Error) {
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      
      throw error;
    }
  }

  private async ensureClient(): Promise<OpenAI> {
    const token = await this.getAccessToken();
    
    // Always create a new client with fresh token to avoid stale auth issues
    if (!this.openaiClient || this.accessToken !== token) {
      console.log('Creating new OpenAI client with fresh token');
      
      // Use the exact endpoint from Python code
      const baseURL = 'https://chat-ai.cisco.com/openai';
      
      this.openaiClient = new OpenAI({
        apiKey: token,
        baseURL: baseURL,
        dangerouslyAllowBrowser: true,
        defaultHeaders: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      console.log('OpenAI client created with baseURL:', baseURL);
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
      console.log('Service not initialized, loading contexts...');
      await this.loadContextFiles();
    }

    const client = await this.ensureClient();
    const systemPrompt = this.buildSystemPrompt();
    
    // Build the user info object exactly like the Python code
    const userInfo = { appkey: this.appKey };
    
    // Convert our messages format to OpenAI format
    const openaiMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
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
      console.log('User info:', userInfo);
      console.log('Message count:', openaiMessages.length);
      
      const response = await client.chat.completions.create({
        model: this.selectedModelId,
        messages: openaiMessages,
        user: JSON.stringify(userInfo), // Match the Python format exactly
        stream: false,
        temperature: 0.7,
        max_tokens: 4096
      });

      console.log('Cisco OpenAI API response received');
      console.log('Response model:', response.model);
      console.log('Response choices:', response.choices.length);

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content in response');
      }

      console.log(`Received response from Cisco OpenAI (${content.length} chars)`);
      return content;
    } catch (error) {
      console.error('Error calling Cisco OpenAI API:', error);
      
      // Log more details about the error
      if (error instanceof Error) {
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      
      // Try to get fresh token and retry once
      if (error && (error.toString().includes('401') || error.toString().includes('auth'))) {
        console.log('Auth error detected, refreshing token and retrying...');
        this.accessToken = ''; // Force token refresh
        this.tokenExpiryTime = 0;
        
        try {
          const newClient = await this.ensureClient();
          const retryResponse = await newClient.chat.completions.create({
            model: this.selectedModelId,
            messages: openaiMessages,
            user: JSON.stringify(userInfo),
            stream: false,
            temperature: 0.7,
            max_tokens: 4096
          });
          
          const retryContent = retryResponse.choices[0]?.message?.content;
          if (retryContent) {
            console.log('Retry successful after token refresh');
            return retryContent;
          }
        } catch (retryError) {
          console.error('Retry also failed:', retryError);
        }
      }
      
      throw error;
    }
  }

  async streamMessage(
    messages: ChatMessage[], 
    onChunk: (chunk: string) => void, 
    onComplete: (fullResponse: string) => void
  ): Promise<void> {
    if (!this.isInitialized) {
      console.log('Service not initialized, loading contexts...');
      await this.loadContextFiles();
    }

    const client = await this.ensureClient();
    const systemPrompt = this.buildSystemPrompt();
    
    // Build the user info object exactly like the Python code
    const userInfo = { appkey: this.appKey };
    
    // Convert our messages format to OpenAI format
    const openaiMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
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
      console.log('User info:', userInfo);
      
      const stream = await client.chat.completions.create({
        model: this.selectedModelId,
        messages: openaiMessages,
        user: JSON.stringify(userInfo), // Match the Python format exactly
        stream: true,
        temperature: 0.7,
        max_tokens: 4096
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
      
      // Try to get fresh token and retry once for streaming too
      if (error && (error.toString().includes('401') || error.toString().includes('auth'))) {
        console.log('Auth error in streaming, refreshing token and retrying...');
        this.accessToken = ''; // Force token refresh
        this.tokenExpiryTime = 0;
        
        try {
          const newClient = await this.ensureClient();
          const retryStream = await newClient.chat.completions.create({
            model: this.selectedModelId,
            messages: openaiMessages,
            user: JSON.stringify(userInfo),
            stream: true,
            temperature: 0.7,
            max_tokens: 4096
          });
          
          let retryFullResponse = '';
          for await (const chunk of retryStream) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              retryFullResponse += content;
              onChunk(content);
            }
          }
          
          console.log('Streaming retry successful after token refresh');
          onComplete(retryFullResponse);
          return;
        } catch (retryError) {
          console.error('Streaming retry also failed:', retryError);
        }
      }
      
      const errorMessage = `Error: Unable to get response from Cisco OpenAI API. ${error instanceof Error ? error.message : 'Unknown error'}`;
      onChunk(errorMessage);
      onComplete(errorMessage);
    }
  }
}