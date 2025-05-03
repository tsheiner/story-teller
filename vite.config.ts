import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Serve context files during development
    static: {
      directory: path.resolve(__dirname, 'src'),
    }
  }
})
