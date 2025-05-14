// src/services/ClaudeServiceAdapter.ts
import { ClaudeService } from './ClaudeService';
import { IAIService, ChatMessage, ContextOptions, ModelOption } from './IAIService';

export class ClaudeServiceAdapter implements IAIService {
  private claudeService: ClaudeService;

  constructor() {
    this.claudeService = new ClaudeService();
  }

  // Model management - delegate to ClaudeService static methods and instance methods
  getAvailableModels(): ModelOption[] {
    return ClaudeService.AVAILABLE_MODELS;
  }

  getSelectedModel(): string {
    return this.claudeService.getSelectedModel();
  }

  setModel(modelId: string): void {
    this.claudeService.setModel(modelId);
  }

  // Context management - delegate all to ClaudeService
  getAvailableRoles(): string[] {
    return this.claudeService.getAvailableRoles();
  }

  getAvailablePersonas(): string[] {
    return this.claudeService.getAvailablePersonas();
  }

  getAvailableScenarios(): string[] {
    return this.claudeService.getAvailableScenarios();
  }

  loadContextFiles(roleName?: string, personaName?: string, scenarioName?: string): Promise<void> {
    return this.claudeService.loadContextFiles(roleName, personaName, scenarioName);
  }

  loadAvailableContexts(): Promise<ContextOptions> {
    return this.claudeService.loadAvailableContexts();
  }

  loadRoleContext(roleName: string): Promise<string> {
    return this.claudeService.loadRoleContext(roleName);
  }

  loadPersonaContext(personaName: string): Promise<string> {
    return this.claudeService.loadPersonaContext(personaName);
  }

  loadScenarioContext(scenarioName: string): Promise<string> {
    return this.claudeService.loadScenarioContext(scenarioName);
  }

  hasLoadedContexts(): boolean {
    return this.claudeService.hasLoadedContexts();
  }

  // Message handling - delegate to ClaudeService
  sendMessage(messages: ChatMessage[]): Promise<string> {
    return this.claudeService.sendMessage(messages);
  }

  streamMessage(
    messages: ChatMessage[], 
    onChunk: (chunk: string) => void, 
    onComplete: (fullResponse: string) => void
  ): Promise<void> {
    return this.claudeService.streamMessage(messages, onChunk, onComplete);
  }
}