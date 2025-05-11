export const StorageKeys = {
  SELECTED_ROLE: 'storyteller_selected_role',
  SELECTED_PERSONA: 'storyteller_selected_persona',
  SELECTED_SCENARIO: 'storyteller_selected_scenario'
};

export const StorageService = {
  // Save selected contexts
  saveSelectedRole(roleName: string): void {
    localStorage.setItem(StorageKeys.SELECTED_ROLE, roleName);
  },
  
  saveSelectedPersona(personaName: string): void {
    localStorage.setItem(StorageKeys.SELECTED_PERSONA, personaName);
  },
  
  saveSelectedScenario(scenarioName: string): void {
    localStorage.setItem(StorageKeys.SELECTED_SCENARIO, scenarioName);
  },
  
  // Retrieve selected contexts with defaults
  getSelectedRole(availableRoles: string[]): string {
    const savedRole = localStorage.getItem(StorageKeys.SELECTED_ROLE);
    // Check if saved role exists in available roles, otherwise use first available
    return savedRole && availableRoles.includes(savedRole) 
      ? savedRole 
      : (availableRoles.length > 0 ? availableRoles[0] : '');
  },
  
  getSelectedPersona(availablePersonas: string[]): string {
    const savedPersona = localStorage.getItem(StorageKeys.SELECTED_PERSONA);
    return savedPersona && availablePersonas.includes(savedPersona)
      ? savedPersona
      : (availablePersonas.length > 0 ? availablePersonas[0] : '');
  },
  
  getSelectedScenario(availableScenarios: string[]): string {
    const savedScenario = localStorage.getItem(StorageKeys.SELECTED_SCENARIO);
    return savedScenario && availableScenarios.includes(savedScenario)
      ? savedScenario
      : (availableScenarios.length > 0 ? availableScenarios[0] : '');
  }
};