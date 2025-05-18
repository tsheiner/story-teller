# Storyteller: A Conversational Design Tool

This application enables you to prototype AI experiences by controlling 4 inputs: 
1. __model role:__ what role the model should play in your experience? what kind of expert, with what kinds of capabilities?
2. __persona:__ who is the model talking to?
3. __scenario__: what are the initial conditions for the conversation?
4. __system__: what kind of underlying system configuration is being managed or monitored?

## Overview

The application provides an interactive chat interface with an AI assistant, enhanced with a workspace panel for visualizations and detailed system information. The user defines the dimensions of the conversation by selecting the model's role, the persona it interacts with, the scenario that sets the context, and the system being managed. The AI assistant adapts its behavior based on these inputs, enabling tailored interactions for various use cases.

Each dimension can be easily customized by adding or removing markdown files in their respective directories within the `public/context/` folder:
- `roles/`: Add new AI roles by creating markdown files defining their behavior and capabilities
- `personas/`: Add new user personas by creating markdown files describing who the AI is talking to
- `scenarios/`: Add new scenarios by creating markdown files that describe specific situations or incidents
- `system/`: Add new system configurations by creating markdown files that define the underlying environment

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
- `ContextSelector`: Allows users to select the dimensions of the conversation
- Context files (in `public/context/`):
  - `roles/`: Role definitions: Define the AI's behavior and capabilities
  - `personas/`: Persona definitions: Define who the AI is talking to
  - `scenarios/`: Scenarios: Describe specific system states or incidents
  - `system/`: System definitions: Describe the underlying system configuration

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

