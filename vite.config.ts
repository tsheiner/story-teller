import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

// Create a plugin to handle the context listing API
const contextApiPlugin = () => ({
  name: 'context-api-plugin',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      // Only handle the specific API endpoint
      if (req.url === '/api/list-contexts') {
        console.log('[API] Received request for context listing')

        try {
          // Base directory for context files
          const contextDir = path.resolve('./public/context')
          console.log('[API] Looking for context files in:', contextDir)
          
          // Get lists of files from each directory
          const roles = fs.readdirSync(path.join(contextDir, 'roles'))
            .filter(file => file.toLowerCase().endsWith('.md'))
            .map(file => file.slice(0, -3)) // Remove .md extension
            
          const personas = fs.readdirSync(path.join(contextDir, 'personas'))
            .filter(file => file.toLowerCase().endsWith('.md'))
            .map(file => file.slice(0, -3))
            
          const scenarios = fs.readdirSync(path.join(contextDir, 'scenarios'))
            .filter(file => file.toLowerCase().endsWith('.md'))
            .map(file => file.slice(0, -3))
          
          // Create response object
          const result = { roles, personas, scenarios }
          
          // Send response
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify(result))
          
          console.log('[API] Sent context files list:', result)
        } catch (error) {
          console.error('[API] Error listing context files:', error)
          res.writeHead(500, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ 
            error: 'Failed to list context files',
            details: error instanceof Error ? error.message : String(error) 
          }))
        }
      } else {
        // Not our API endpoint, let the next middleware handle it
        next()
      }
    })
  }
})

// Vite configuration
export default defineConfig({
  plugins: [
    react(),
    contextApiPlugin()
  ],
  server: {
    // Serve static files from public directory
    static: {
      directory: path.resolve('./public'),
    }
  }
})