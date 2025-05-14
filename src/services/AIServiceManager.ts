// src/services/AIServiceManager.ts
import { IAIService, ChatMessage, ContextOptions, ModelOption } from './IAIService';
import { ClaudeServiceAdapter } from './ClaudeServiceAdapter';
import { CiscoOpenAIService } from './CiscoOpenAIService';

export class AIServiceManager implements IAIService {
  private claudeService: IAIService;
  private ciscoService: IAIService;
  private currentService: IAIService;
  private allModels: ModelOption[] = [];
  private currentModelId: string = '';

  constructor() {
    // Initialize both services
    this.claudeService = new ClaudeServiceAdapter();
    this.ciscoService = new CiscoOpenAIService();
    
    // Combine models from both services
    this.allModels = [
      ...this.claudeService.getAvailableModels(),
      ...this.ciscoService.getAvailableModels()
    ];
    
    // Set default service and model (Claude by default)
    this.currentService = this.claudeService;
    this.currentModelId = this.allModels[0]?.id || '';
    
    console.log('AIServiceManager initialized with models:', this.allModels.map(m => m.name));
  }

  private getServiceForModel(modelId: string): IAIService {
    // Claude models start with 'claude-'
    if (modelId.startsWith('claude-')) {
      return this.claudeService;
    }
    // Everything else goes to Cisco OpenAI (for now)
    return this.ciscoService;
  }

  // Model management
  getAvailableModels(): ModelOption[] {
    return this.allModels;
  }

  getSelectedModel(): string {
    return this.currentModelId;
  }

  setModel(modelId: string): void {
    const model = this.allModels.find(m => m.id === modelId);
    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }
    
    const newService = this.getServiceForModel(modelId);
    const wasServiceSwitch = this.currentService !== newService;
    
    // Log the model change
    if (this.currentModelId !== modelId) {
      const oldModel = this.allModels.find(m => m.id === this.currentModelId);
      console.log('%c🔄 MODEL MANAGER: Model Changed', 'background: #9966cc; color: white; padding: 4px 8px; border-radius: 4px;');
      console.log(`From: ${oldModel?.name || this.currentModelId} (${this.currentService === this.claudeService ? 'Claude' : 'Cisco'})`);
      console.log(`To: ${model.name} (${newService === this.claudeService ? 'Claude' : 'Cisco'})`);
      
      if (wasServiceSwitch) {
        console.log('🔄 Service switched!');
      }
    }
    
    this.currentModelId = modelId;
    this.currentService = newService;
    
    // Set the model on the appropriate service
    this.currentService.setModel(modelId);
    
    // If we switched services, we need to ensure context is loaded
    if (wasServiceSwitch && !this.currentService.hasLoadedContexts()) {
      console.log('Loading contexts for switched service...');
      this.currentService.loadContextFiles();
    }
  }

  // Context management - all delegated to current service
  getAvailableRoles(): string[] {
    return this.currentService.getAvailableRoles();
  }

  getAvailablePersonas(): string[] {
    return this.currentService.getAvailablePersonas();
  }

  getAvailableScenarios(): string[] {
    return this.currentService.getAvailableScenarios();
  }

  async loadContextFiles(roleName?: string, personaName?: string, scenarioName?: string): Promise<void> {
    // Load context for both services to ensure they're both ready
    await Promise.all([
      this.claudeService.loadContextFiles(roleName, personaName, scenarioName),
      this.ciscoService.loadContextFiles(roleName, personaName, scenarioName)
    ]);
  }

  async loadAvailableContexts(): Promise<ContextOptions> {
    return this.currentService.loadAvailableContexts();
  }

  async loadRoleContext(roleName: string): Promise<string> {
    // Load context for both services to keep them in sync
    const [claudeResult, ciscoResult] = await Promise.all([
      this.claudeService.loadRoleContext(roleName),
      this.ciscoService.loadRoleContext(roleName)
    ]);
    // Return result from current service
    return this.currentService === this.claudeService ? claudeResult : ciscoResult;
  }

  async loadPersonaContext(personaName: string): Promise<string> {
    // Load context for both services to keep them in sync
    const [claudeResult, ciscoResult] = await Promise.all([
      this.claudeService.loadPersonaContext(personaName),
      this.ciscoService.loadPersonaContext(personaName)
    ]);
    // Return result from current service
    return this.currentService === this.claudeService ? claudeResult : ciscoResult;
  }

  async loadScenarioContext(scenarioName: string): Promise<string> {
    // Load context for both services to keep them in sync
    const [claudeResult, ciscoResult] = await Promise.all([
      this.claudeService.loadScenarioContext(scenarioName),
      this.ciscoService.loadScenarioContext(scenarioName)
    ]);
    // Return result from current service
    return this.currentService === this.claudeService ? claudeResult : ciscoResult;
  }

  hasLoadedContexts(): boolean {
    return this.currentService.hasLoadedContexts();
  }

  // Message handling - delegated to current service
  async sendMessage(messages: ChatMessage[]): Promise<string> {
    return this.currentService.sendMessage(messages);
  }

  async streamMessage(
    messages: ChatMessage[], 
    onChunk: (chunk: string) => void, 
    onComplete: (fullResponse: string) => void
  ): Promise<void> {
    return this.currentService.streamMessage(messages, onChunk, onComplete);
  }
}