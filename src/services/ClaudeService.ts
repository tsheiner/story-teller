import Anthropic from '@anthropic-ai/sdk';

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

  async loadContextFiles() {
    try {
      const roleResponse = await fetch('/context/roles/system_manager.md');
      const scenarioResponse = await fetch('/context/scenarios/high_cpu_load.md');
      
      this.roleContext = await roleResponse.text();
      this.scenarioContext = await scenarioResponse.text();
    } catch (error) {
      console.error('Error loading context files:', error);
      throw error;
    }
  }

  private buildSystemPrompt(): string {
    return `${this.roleContext}\n\nCurrent Scenario:\n${this.scenarioContext}`;
  }

  async sendMessage(messages: ChatMessage[]): Promise<string> {
    if (!this.roleContext || !this.scenarioContext) {
      await this.loadContextFiles();
    }

    const systemPrompt = this.buildSystemPrompt();
    
    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-opus-20240229',
        max_tokens: 1024,
        system: systemPrompt,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      });

      const content = response.content[0];
      if ('text' in content) {
        return content.text;
      }
      throw new Error('Unexpected response format from Claude API');
    } catch (error) {
      console.error('Error calling Claude API:', error);
      throw error;
    }
  }
}