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
  
  // State for available options
  const [availableContexts, setAvailableContexts] = useState({
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
        // Load available contexts from directories
        const contexts = await claudeService.current.loadAvailableContexts();
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
    setSelectedRole(role);
    await claudeService.current.loadRoleContext(role);
    StorageService.saveSelectedRole(role);
  };
  
  const handlePersonaChange = async (persona: string) => {
    setSelectedPersona(persona);
    await claudeService.current.loadPersonaContext(persona);
    StorageService.saveSelectedPersona(persona);
  };
  
  const handleScenarioChange = async (scenario: string) => {
    setSelectedScenario(scenario);
    await claudeService.current.loadScenarioContext(scenario);
    StorageService.saveSelectedScenario(scenario);
  };

  return (
    <>
      <UnifiedLayout
        chatPanel={
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ flex: 1, overflow: 'auto' }}>
              <ChatInterface />
            </div>
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
        }
        workspacePanel={<Workspace />}
        isWorkspaceVisible={isWorkspaceVisible}
      />
    </>
  )
}

export default App