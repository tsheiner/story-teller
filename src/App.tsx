import { useState } from 'react'
import { Button } from 'react-bootstrap'
import 'bootstrap/dist/css/bootstrap.min.css'
import './App.css'
import { ChatInterface } from './components/ChatInterface'
import { Workspace } from './components/Workspace'
import { UnifiedLayout } from './layouts/UnifiedLayout'
import { defaultProjectContext } from './config/projectContext'

function App() {
  const [isWorkspaceVisible, setIsWorkspaceVisible] = useState(
    defaultProjectContext.workspaceConfig.defaultView === 'split-view'
  );

  const toggleWorkspace = () => setIsWorkspaceVisible(!isWorkspaceVisible);

  return (
    <>
      <Button
        variant="outline-primary"
        onClick={toggleWorkspace}
        style={{
          position: 'fixed',
          top: '1rem',
          right: '1rem',
          zIndex: 1000
        }}
      >
        {isWorkspaceVisible ? 'Hide' : 'Show'} Workspace
      </Button>

      <UnifiedLayout
        context={defaultProjectContext}
        chatPanel={<ChatInterface />}
        workspacePanel={<Workspace />}
        isWorkspaceVisible={isWorkspaceVisible}
      />
    </>
  )
}

export default App
