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
        if (req.url?.startsWith('/api/list-files')) {
          const url = new URL(req.url, 'http://localhost');
          const dirPath = url.searchParams.get('dir');
          
          if (dirPath) {
            try {
              // Get the absolute path within the public directory
              const absolutePath = path.join(__dirname, 'public', dirPath);
              
              // Read directory contents
              const files = fs.readdirSync(absolutePath)
                .filter(file => file.endsWith('.md'))
                .map(file => file.replace('.md', ''));
              
              // Send JSON response
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(files));
              return;
            } catch (error) {
              console.error(`Error reading directory ${dirPath}:`, error);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: 'Failed to read directory' }));
              return;
            }
          }
        }
        
        // Not a directory listing request, continue to next middleware
        next();
      }
    ]
  }
})