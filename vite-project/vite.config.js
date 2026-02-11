import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react({
    jsxRuntime: 'automatic',
    jsc: {
      transform: {
        react: {
          throwIfNamespace: false, // Permite namespaces en JSX
        }
      }
    }
  })],
  build: {
    outDir: '../public',
    emptyDir: false,
  }
})