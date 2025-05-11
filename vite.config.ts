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
        // Note: Raw req.url might not include full URL, so we need to handle it differently
        const reqUrl = req.url || '';
        console.log('Request received:', reqUrl);
        
        if (reqUrl && reqUrl.includes('/api/list-files')) {
          console.log('API request detected!');
          
          // Extract the dir parameter directly from the URL string
          const dirMatch = reqUrl.match(/dir=(.*?)(&|$)/);
          const dirPath = dirMatch ? dirMatch[1] : null;
          
          console.log('Extracted dir path:', dirPath);
          
          console.log('Directory path requested:', dirPath);
          
          if (dirPath) {
            try {
              // Get the absolute path within the public directory
              const absolutePath = path.join(__dirname, 'public', dirPath);
              console.log('Absolute path:', absolutePath);
              
              // Check if directory exists
              if (!fs.existsSync(absolutePath)) {
                console.error(`Directory does not exist: ${absolutePath}`);
                res.statusCode = 404;
                res.end(JSON.stringify({ error: 'Directory not found' }));
                return;
              }
              
              // Read directory contents
              const allFiles = fs.readdirSync(absolutePath);
              console.log('All files in directory:', allFiles);
              
              const mdFiles = allFiles
                .filter(file => file.endsWith('.md'))
                .map(file => file.replace('.md', ''));
              
              console.log('Filtered MD files:', mdFiles);
              
              // Send JSON response - stringify properly
              const responseData = mdFiles;
              res.setHeader('Content-Type', 'application/json');
              const jsonResponse = JSON.stringify(responseData);
              res.end(jsonResponse);
              console.log('Response sent:', jsonResponse);
              return;
            } catch (error) {
              console.error(`Error reading directory ${dirPath}:`, error);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: 'Failed to read directory', details: error.message }));
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