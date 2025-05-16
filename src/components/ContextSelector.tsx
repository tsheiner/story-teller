import { ChangeEvent } from 'react';
import styles from './ContextSelector.module.css';
import { ModelOption } from '../services/ClaudeService';

export interface ContextSelectorProps {
  availableContexts: {
    roles: string[];
    personas: string[];
    scenarios: string[];
    systems: string[];
  };
  availableModels: ModelOption[];
  selectedRole: string;
  selectedPersona: string;
  selectedScenario: string;
  selectedSystem: string;
  selectedModel: string;
  onRoleChange: (role: string) => void;
  onPersonaChange: (persona: string) => void;
  onScenarioChange: (scenario: string) => void;
  onSystemChange: (system: string) => void;
  onModelChange: (model: string) => void;
}

export function ContextSelector({
  availableContexts,
  availableModels,
  selectedRole,
  selectedPersona,
  selectedScenario,
  selectedSystem,
  selectedModel,
  onRoleChange,
  onPersonaChange,
  onScenarioChange,
  onSystemChange,
  onModelChange
}: ContextSelectorProps) {
  const handleRoleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    onRoleChange(e.target.value);
  };
  
  const handlePersonaChange = (e: ChangeEvent<HTMLSelectElement>) => {
    onPersonaChange(e.target.value);
  };
  
  const handleScenarioChange = (e: ChangeEvent<HTMLSelectElement>) => {
    onScenarioChange(e.target.value);
  };

  const handleSystemChange = (e: ChangeEvent<HTMLSelectElement>) => {
    onSystemChange(e.target.value);
  };

  const handleModelChange = (e: ChangeEvent<HTMLSelectElement>) => {
    onModelChange(e.target.value);
  };
  
  return (
    <div className={styles.contextSelectorContainer}>
      <div className={styles.selectorGroup}>
        <label>Role:</label>
        <select
          value={selectedRole}
          onChange={handleRoleChange}
          disabled={availableContexts.roles.length === 0}
        >
          {availableContexts.roles.length === 0 ? (
            <option value="">No roles available</option>
          ) : (
            availableContexts.roles.map(role => (
              <option key={role} value={role}>{role}</option>
            ))
          )}
        </select>
      </div>

      <div className={styles.selectorGroup}>
        <label>Persona:</label>
        <select
          value={selectedPersona}
          onChange={handlePersonaChange}
          disabled={availableContexts.personas.length === 0}
        >
          {availableContexts.personas.length === 0 ? (
            <option value="">No personas available</option>
          ) : (
            availableContexts.personas.map(persona => (
              <option key={persona} value={persona}>{persona}</option>
            ))
          )}
        </select>
      </div>

      <div className={styles.selectorGroup}>
        <label>System:</label>
        <select
          value={selectedSystem}
          onChange={handleSystemChange}
          disabled={availableContexts.systems.length === 0}
        >
          {availableContexts.systems.length === 0 ? (
            <option value="">No system contexts available</option>
          ) : (
            availableContexts.systems.map(system => (
              <option key={system} value={system}>{system}</option>
            ))
          )}
        </select>
      </div>

      <div className={styles.selectorGroup}>
        <label>Scenario:</label>
        <select
          value={selectedScenario}
          onChange={handleScenarioChange}
          disabled={availableContexts.scenarios.length === 0}
        >
          {availableContexts.scenarios.length === 0 ? (
            <option value="">No scenarios available</option>
          ) : (
            availableContexts.scenarios.map(scenario => (
              <option key={scenario} value={scenario}>{scenario}</option>
            ))
          )}
        </select>
      </div>

      <hr className={styles.divider} />
      
      <div className={styles.selectorGroup}>
        <label>AI Model:</label>
        <select 
          value={selectedModel} 
          onChange={handleModelChange}
          disabled={availableModels.length === 0}
        >
          {availableModels.length === 0 ? (
            <option value="">No models available</option>
          ) : (
            availableModels.map(model => (
              <option key={model.id} value={model.id}>
                {model.name} - {model.description}
              </option>
            ))
          )}
        </select>
      </div>
    </div>
  );
}