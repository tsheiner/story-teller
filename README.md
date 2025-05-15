# Storyteller: Designing Conversations in 3 Dimensions

This application enables you to prototype AI experiences by controlling 3 inputs: 
1. __model role:__ what role the model should play in your experience? what kind of expert, with what kinds of capabilities?
2. __persona:__ who is the model talking to?
3. __scenario__: what are the initial conditions for the conversation?

## Overview

The application provides an interactive chat interface with an AI assistant, enhanced with a workspace panel for visualizations and detailed system information. The user defines the dimensions of the conversation by selecting the model's role, the persona it interacts with, and the scenario that sets the context. The AI assistant adapts its behavior based on these inputs, enabling tailored interactions for various use cases.

### Key Features
- Persistent chat interface with the AI assistant
- Always-visible workspace panel for visualizations and system information
- Context-aware AI responses based on user-defined roles, personas, and scenarios

### Architecture
The application is built with:
- React + TypeScript + Vite for the frontend framework
- React Bootstrap for UI components
- Anthropic's API for AI interactions (currently used)
- CSS Modules for component-specific styling

Key components:
- `ChatInterface`: Manages chat interactions with the AI assistant
- `Workspace`: Displays system information and visualizations, always visible
- `UnifiedLayout`: Maintains persistent chat while integrating the workspace panel
- Context files (in `public/context/`):
  - `roles/`: Role definitions: Define the AI's behavior and capabilities
  - `personas/`:Persona definitions: Define who the AI is talking to
  - `scenarios/`:Scenarios: Describe specific system states or incidents

## Setup and Running

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```
4. Add your Anthropic API key to the `.env` file:
   ```
   VITE_ANTHROPIC_API_KEY=your-api-key-here
   ```
   **Note:** The application currently uses Anthropic's API for AI interactions, so an Anthropic API key is required.
   
5. Start the development server:
   ```bash
   npm run dev
   ```

The application will be available at http://localhost:5173 (or another port if 5173 is in use).

## Development Notes

- The chat interface maintains state even when toggling between views
- Role, persona, and scenario contexts are loaded from markdown files in `src/context/`
- The workspace panel is always visible and can display visualizations or detailed information based on the conversation context

## Environment Variables

- `VITE_ANTHROPIC_API_KEY`: Your Anthropic API key for AI assistant access
