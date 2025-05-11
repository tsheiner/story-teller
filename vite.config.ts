import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Serve context files during development
    static: {
      directory: path.resolve(__dirname, 'public'),
    },
    middlewares: [
      (req, res, next) => {
        // Check if this is a request for directory listing
        const reqUrl = req.url || '';
        
        if (reqUrl && reqUrl.startsWith('/api/list-contexts')) {
          console.log('[API] Listing context directories');
          
          try {
            // Base directory for context files
            const contextDir = path.join(__dirname, 'public', 'context');
            
            // Get lists of files from each directory
            const roles = fs.readdirSync(path.join(contextDir, 'roles'))
              .filter(file => file.toLowerCase().endsWith('.md'))
              .map(file => file.slice(0, -3)); // Remove .md extension
              
            const personas = fs.readdirSync(path.join(contextDir, 'personas'))
              .filter(file => file.toLowerCase().endsWith('.md'))
              .map(file => file.slice(0, -3));
              
            const scenarios = fs.readdirSync(path.join(contextDir, 'scenarios'))
              .filter(file => file.toLowerCase().endsWith('.md'))
              .map(file => file.slice(0, -3));
            
            // Create response object
            const result = { roles, personas, scenarios };
            
            // Set response headers
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 200;
            
            // Send response
            res.end(JSON.stringify(result));
            
            console.log('[API] Sent context files list:', result);
            return;
          } catch (error) {
            console.error('[API] Error listing context files:', error);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ 
              error: 'Failed to list context files',
              details: error instanceof Error ? error.message : String(error) 
            }));
            return;
          }
        }
        
        // Not a directory listing request, continue to next middleware
        next();
      }
    ]
  }
})