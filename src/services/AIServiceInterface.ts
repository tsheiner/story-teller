// src/services/IAIService.ts
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

export interface IAIService {
  // Model management
  getAvailableModels(): ModelOption[];
  getSelectedModel(): string;
  setModel(modelId: string): void;
  
  // Context management (exactly matching ClaudeService interface)
  getAvailableRoles(): string[];
  getAvailablePersonas(): string[];
  getAvailableScenarios(): string[];
  loadContextFiles(roleName?: string, personaName?: string, scenarioName?: string): Promise<void>;
  loadAvailableContexts(): Promise<ContextOptions>;
  loadRoleContext(roleName: string): Promise<string>;
  loadPersonaContext(personaName: string): Promise<string>;
  loadScenarioContext(scenarioName: string): Promise<string>;
  hasLoadedContexts(): boolean;
  
  // Message handling
  sendMessage(messages: ChatMessage[]): Promise<string>;
  streamMessage(
    messages: ChatMessage[], 
    onChunk: (chunk: string) => void, 
    onComplete: (fullResponse: string) => void
  ): Promise<void>;
}