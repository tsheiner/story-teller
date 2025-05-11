import { ChangeEvent } from 'react';
import styles from './ContextSelector.module.css';

export interface ContextSelectorProps {
  availableContexts: {
    roles: string[];
    personas: string[];
    scenarios: string[];
  };
  selectedRole: string;
  selectedPersona: string;
  selectedScenario: string;
  onRoleChange: (role: string) => void;
  onPersonaChange: (persona: string) => void;
  onScenarioChange: (scenario: string) => void;
}

export function ContextSelector({
  availableContexts,
  selectedRole,
  selectedPersona,
  selectedScenario,
  onRoleChange,
  onPersonaChange,
  onScenarioChange
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
    </div>
  );
}