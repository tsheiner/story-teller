export interface ProjectContext {
  systemCapabilities: {
    name: string;
    description: string;
    capabilities: string[];
  };
  aiAssistant: {
    name: string;
    role: string;
    contextInstructions: string[];
  };
  workspaceConfig: {
    defaultView: 'chat-centered' | 'split-view';
    workspaceFeatures: string[];
  };
}

export const defaultProjectContext: ProjectContext = {
  systemCapabilities: {
    name: "Complex System Manager",
    description: "An AI-assisted interface for managing and visualizing complex system state",
    capabilities: [
      "Real-time system monitoring",
      "Dynamic dashboard generation",
      "Interactive data visualization",
      "System state modification through AI assistance"
    ]
  },
  aiAssistant: {
    name: "System Assistant",
    role: "Expert system management assistant",
    contextInstructions: [
      "Assistant has access to system monitoring and control APIs",
      "Can generate visualizations based on user queries",
      "Provides explanations for system state and changes",
      "Suggests proactive system optimizations"
    ]
  },
  workspaceConfig: {
    defaultView: 'chat-centered',
    workspaceFeatures: [
      "Dynamic dashboard creation",
      "Real-time data visualization",
      "Collaborative workspace",
      "System state inspection"
    ]
  }
}