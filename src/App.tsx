import { useState, useEffect, useRef } from 'react'
import 'bootstrap/dist/css/bootstrap.min.css'
import './App.css'
import { ChatInterface } from './components/ChatInterface'
import { Workspace } from './components/Workspace'
import { UnifiedLayout } from './layouts/UnifiedLayout'
import { ContextSelector } from './components/ContextSelector'
import { ClaudeServiceAdapter } from './services/ClaudeServiceAdapter'
import { IAIService } from './services/IAIService'
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
  }>({
    roles: [],
    personas: [],
    scenarios: []
  });
  
  // State for selected options
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedPersona, setSelectedPersona] = useState('');
  const [selectedScenario, setSelectedScenario] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  
  // Reference to AI service (using abstraction now)
  const aiService = useRef<IAIService>(new ClaudeServiceAdapter());
  
  // Load available contexts and restore selections
  useEffect(() => {
    const loadContextOptions = async () => {
      try {
        // Load available contexts from the AI service
        const contexts = await aiService.current.loadAvailableContexts();
        console.log('Loaded available contexts:', contexts);
        setAvailableContexts(contexts);
        
        // Restore selections from localStorage
        const restoredRole = StorageService.getSelectedRole(contexts.roles);
        const restoredPersona = StorageService.getSelectedPersona(contexts.personas);
        const restoredScenario = StorageService.getSelectedScenario(contexts.scenarios);
        
        // Get available model IDs from the AI service
        const availableModels = aiService.current.getAvailableModels();
        const availableModelIds = availableModels.map(model => model.id);
        const restoredModel = StorageService.getSelectedModel(availableModelIds);
        
        // Set state with restored values
        setSelectedRole(restoredRole);
        setSelectedPersona(restoredPersona);
        setSelectedScenario(restoredScenario);
        setSelectedModel(restoredModel);
        
        // Initialize the AI service with saved preferences
        if (restoredRole) await aiService.current.loadRoleContext(restoredRole);
        if (restoredPersona) await aiService.current.loadPersonaContext(restoredPersona);
        if (restoredScenario) await aiService.current.loadScenarioContext(restoredScenario);
        if (restoredModel) aiService.current.setModel(restoredModel);
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
    await aiService.current.loadRoleContext(role);
    StorageService.saveSelectedRole(role);
    console.log("Role context updated");
  };
  
  const handlePersonaChange = async (persona: string) => {
    console.log(`App: Changing persona to ${persona}`);
    setSelectedPersona(persona);
    // Load the new context and rebuild the system prompt
    await aiService.current.loadPersonaContext(persona);
    StorageService.saveSelectedPersona(persona);
    console.log("Persona context updated");
  };
  
  const handleScenarioChange = async (scenario: string) => {
    console.log(`App: Changing scenario to ${scenario}`);
    setSelectedScenario(scenario);
    // Load the new context and rebuild the system prompt
    await aiService.current.loadScenarioContext(scenario);
    StorageService.saveSelectedScenario(scenario);
    console.log("Scenario context updated");
  };
  
  const handleModelChange = (model: string) => {
    console.log(`App: Changing model to ${model}`);
    setSelectedModel(model);
    // Update the model in AI service
    aiService.current.setModel(model);
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
                aiService={aiService.current}
                onToggleContext={toggleContext}
                showContext={showContext}
              />
            </div>
            <div style={{ display: showContext ? 'block' : 'none' }}>
              <ContextSelector 
                availableContexts={availableContexts}
                availableModels={aiService.current.getAvailableModels()}
                selectedRole={selectedRole}
                selectedPersona={selectedPersona}
                selectedScenario={selectedScenario}
                selectedModel={selectedModel}
                onRoleChange={handleRoleChange}
                onPersonaChange={handlePersonaChange}
                onScenarioChange={handleScenarioChange}
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