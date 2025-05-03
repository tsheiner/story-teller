# AI System Manager Prototype

This prototype demonstrates an AI-assisted interface for system management and monitoring. It uses Claude (via Anthropic's API) to provide intelligent assistance in a context-aware environment.

## Overview

The application provides an interactive chat interface with Claude, enhanced with a workspace panel for visualizations and detailed system information. The AI assistant is context-aware of both its role as a system manager and specific scenarios (like system incidents) that it can help troubleshoot.

### Key Features
- Persistent chat interface with Claude
- Collapsible workspace panel for visualizations and system information
- Context-aware AI responses based on predefined roles and scenarios
- Smooth transitions between workspace views

### Architecture
The application is built with:
- React + TypeScript + Vite for the frontend framework
- React Bootstrap for UI components
- Anthropic's Claude API for AI interactions
- CSS Modules for component-specific styling

Key components:
- `ChatInterface`: Manages chat interactions with Claude
- `Workspace`: Displays system information and visualizations
- `UnifiedLayout`: Maintains persistent chat while allowing workspace toggling
- Context files (in `src/context/`):
  - Role definitions: Define the AI's behavior and capabilities
  - Scenarios: Describe specific system states or incidents

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
5. Start the development server:
   ```bash
   npm run dev
   ```

The application will be available at http://localhost:5173 (or another port if 5173 is in use).

## Development Notes

- The chat interface maintains state even when toggling the workspace view
- Role and scenario contexts are loaded from markdown files in `src/context/`
- The workspace panel can be used to display visualizations or detailed information based on the conversation context

## Environment Variables

- `VITE_ANTHROPIC_API_KEY`: Your Anthropic API key for Claude access
