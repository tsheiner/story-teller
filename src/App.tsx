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
        // Debug: Test the API endpoints directly 
        console.log('Testing direct API calls...');
        
        try {
          const rolesResponse = await fetch('/api/list-files?dir=context/roles');
          const rolesText = await rolesResponse.text();
          console.log('Direct API call for roles raw response:', rolesText);
          try {
            const roles = JSON.parse(rolesText);
            console.log('Direct API call for roles parsed:', roles);
          } catch (parseError) {
            console.error('Failed to parse roles response:', parseError);
          }
        } catch (e) {
          console.error('Direct API roles fetch failed:', e);
        }
        
        try {
          const personasResponse = await fetch('/api/list-files?dir=context/personas');
          const personasText = await personasResponse.text();
          console.log('Direct API call for personas raw response:', personasText);
          try {
            const personas = JSON.parse(personasText);
            console.log('Direct API call for personas parsed:', personas);
          } catch (parseError) {
            console.error('Failed to parse personas response:', parseError);
          }
        } catch (e) {
          console.error('Direct API personas fetch failed:', e);
        }
        
        try {
          const scenariosResponse = await fetch('/api/list-files?dir=context/scenarios');
          const scenariosText = await scenariosResponse.text();
          console.log('Direct API call for scenarios raw response:', scenariosText);
          try {
            const scenarios = JSON.parse(scenariosText);
            console.log('Direct API call for scenarios parsed:', scenarios);
          } catch (parseError) {
            console.error('Failed to parse scenarios response:', parseError);
          }
        } catch (e) {
          console.error('Direct API scenarios fetch failed:', e);
        }
        
        // Load available contexts from directories
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