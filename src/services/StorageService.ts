export const StorageKeys = {
  SELECTED_ROLE: 'storyteller_selected_role',
  SELECTED_PERSONA: 'storyteller_selected_persona',
  SELECTED_SCENARIO: 'storyteller_selected_scenario',
  SELECTED_SYSTEM: 'storyteller_selected_system',
  SELECTED_MODEL: 'storyteller_selected_model'
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

  saveSelectedSystem(systemName: string): void {
    localStorage.setItem(StorageKeys.SELECTED_SYSTEM, systemName);
  },

  saveSelectedModel(modelId: string): void {
    localStorage.setItem(StorageKeys.SELECTED_MODEL, modelId);
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
  },

  getSelectedSystem(availableSystems: string[]): string {
    const savedSystem = localStorage.getItem(StorageKeys.SELECTED_SYSTEM);
    return savedSystem && availableSystems.includes(savedSystem)
      ? savedSystem
      : (availableSystems.length > 0 ? availableSystems[0] : '');
  },

  getSelectedModel(availableModels: string[]): string {
    const savedModel = localStorage.getItem(StorageKeys.SELECTED_MODEL);
    return savedModel && availableModels.includes(savedModel)
      ? savedModel
      : (availableModels.length > 0 ? availableModels[0] : 'claude-3-opus-20240229');
  }
};