import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
//
// The frontend calls relative "/api/..." paths so the same code works
// against the production Nginx Ingress (single origin, path-based
// routing to each microservice — see k8s/ingress/ingress.yaml) and
// against local dev, where this proxy plays the same role: it fans
// "/api/<prefix>" out to whichever backend service owns that prefix.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/auth': 'http://localhost:3001',
      '/api/staff': 'http://localhost:3001',
      '/api/parties': 'http://localhost:3002',
      '/api/inventory': 'http://localhost:3003',
      '/api/transactions': 'http://localhost:3004',
      '/api/insights': 'http://localhost:3005',
    },
  },
})
