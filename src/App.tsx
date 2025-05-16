import { useState, useEffect, useRef } from 'react'
import 'bootstrap/dist/css/bootstrap.min.css'
import './App.css'
import { ChatInterface } from './components/ChatInterface'
import { Workspace } from './components/Workspace'
import { UnifiedLayout } from './layouts/UnifiedLayout'
import { ContextSelector } from './components/ContextSelector'
import { ClaudeService } from './services/ClaudeService'
import { StorageService } from './services/StorageService'

function App() {
  // Always show workspace
  const isWorkspaceVisible = true;
  
  // State for context selector visibility
  const [showContext, setShowContext] = useState(false);
  
  // State for available options
  const [availableContexts, setAvailableContexts] = useState<{
    roles: string[];
    personas: string[];
    scenarios: string[];
    systems: string[];
  }>({
    roles: [],
    personas: [],
    scenarios: [],
    systems: []
  });
  
  // State for selected options
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedPersona, setSelectedPersona] = useState('');
  const [selectedScenario, setSelectedScenario] = useState('');
  const [selectedSystem, setSelectedSystem] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  
  // Reference to ClaudeService
  const claudeService = useRef(new ClaudeService());
  
  // Load available contexts and restore selections
  useEffect(() => {
    const loadContextOptions = async () => {
      try {
        // Load available contexts from the API
        const contexts = await claudeService.current.loadAvailableContexts();
        console.log('Loaded available contexts:', contexts);
        setAvailableContexts(contexts);
        
        // Restore selections from localStorage
        const restoredRole = StorageService.getSelectedRole(contexts.roles);
        const restoredPersona = StorageService.getSelectedPersona(contexts.personas);
        const restoredScenario = StorageService.getSelectedScenario(contexts.scenarios);
        const restoredSystem = StorageService.getSelectedSystem(contexts.systems);

        // Get available model IDs
        const availableModelIds = ClaudeService.AVAILABLE_MODELS.map(model => model.id);
        const restoredModel = StorageService.getSelectedModel(availableModelIds);

        // Set state with restored values
        setSelectedRole(restoredRole);
        setSelectedPersona(restoredPersona);
        setSelectedScenario(restoredScenario);
        setSelectedSystem(restoredSystem);
        setSelectedModel(restoredModel);
        
        // Initialize the Claude service with saved preferences
        if (restoredRole) await claudeService.current.loadRoleContext(restoredRole);
        if (restoredPersona) await claudeService.current.loadPersonaContext(restoredPersona);
        if (restoredScenario) await claudeService.current.loadScenarioContext(restoredScenario);
        if (restoredSystem) await claudeService.current.loadSystemContext(restoredSystem);
        if (restoredModel) claudeService.current.setModel(restoredModel);
      } catch (error) {
        console.error('Error initializing app:', error);
      }
    };
    
    loadContextOptions();
  }, []);
  
  // Handle context changes
  const handleRoleChange = async (role: string) => {
    console.log(`App: Changing role to ${role}`);
    setSelectedRole(role);
    // Load the new context and rebuild the system prompt
    await claudeService.current.loadRoleContext(role);
    StorageService.saveSelectedRole(role);
    console.log("Role context updated");
  };
  
  const handlePersonaChange = async (persona: string) => {
    console.log(`App: Changing persona to ${persona}`);
    setSelectedPersona(persona);
    // Load the new context and rebuild the system prompt
    await claudeService.current.loadPersonaContext(persona);
    StorageService.saveSelectedPersona(persona);
    console.log("Persona context updated");
  };
  
  const handleScenarioChange = async (scenario: string) => {
    console.log(`App: Changing scenario to ${scenario}`);
    setSelectedScenario(scenario);
    // Load the new context and rebuild the system prompt
    await claudeService.current.loadScenarioContext(scenario);
    StorageService.saveSelectedScenario(scenario);
    console.log("Scenario context updated");
  };

  const handleSystemChange = async (system: string) => {
    console.log(`App: Changing system to ${system}`);
    setSelectedSystem(system);
    // Load the new context and rebuild the system prompt
    await claudeService.current.loadSystemContext(system);
    StorageService.saveSelectedSystem(system);
    console.log("System context updated");
  };
  
  const handleModelChange = (model: string) => {
    console.log(`App: Changing model to ${model}`);
    setSelectedModel(model);
    // Update the model in Claude service
    claudeService.current.setModel(model);
    StorageService.saveSelectedModel(model);
    console.log("Model selection updated");
  };
  
  // Toggle context selector visibility
  const toggleContext = () => {
    setShowContext(!showContext);
  };

  return (
    <>
      <UnifiedLayout
        chatPanel={
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ flex: 1, overflow: 'auto' }}>
              <ChatInterface 
                claudeService={claudeService.current}
                onToggleContext={toggleContext}
                showContext={showContext}
              />
            </div>
            <div style={{ display: showContext ? 'block' : 'none' }}>
              <ContextSelector
                availableContexts={availableContexts}
                availableModels={ClaudeService.AVAILABLE_MODELS}
                selectedRole={selectedRole}
                selectedPersona={selectedPersona}
                selectedScenario={selectedScenario}
                selectedSystem={selectedSystem}
                selectedModel={selectedModel}
                onRoleChange={handleRoleChange}
                onPersonaChange={handlePersonaChange}
                onScenarioChange={handleScenarioChange}
                onSystemChange={handleSystemChange}
                onModelChange={handleModelChange}
              />
            </div>
          </div>
        }
        workspacePanel={<Workspace />}
        isWorkspaceVisible={isWorkspaceVisible}
      />
    </>
  )
}

export default App