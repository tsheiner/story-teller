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
  }>({
    roles: [],
    personas: [],
    scenarios: []
  });
  
  // State for selected options
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedPersona, setSelectedPersona] = useState('');
  const [selectedScenario, setSelectedScenario] = useState('');
  
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
        
        // Set state with restored values
        setSelectedRole(restoredRole);
        setSelectedPersona(restoredPersona);
        setSelectedScenario(restoredScenario);
        
        // Load the context files
        if (restoredRole) await claudeService.current.loadRoleContext(restoredRole);
        if (restoredPersona) await claudeService.current.loadPersonaContext(restoredPersona);
        if (restoredScenario) await claudeService.current.loadScenarioContext(restoredScenario);
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
                selectedRole={selectedRole}
                selectedPersona={selectedPersona}
                selectedScenario={selectedScenario}
                onRoleChange={handleRoleChange}
                onPersonaChange={handlePersonaChange}
                onScenarioChange={handleScenarioChange}
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