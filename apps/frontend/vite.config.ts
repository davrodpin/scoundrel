import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// @ts-ignore - Ignorando erro de tipos do Vite para resolver conflito de versões
export default defineConfig({
  plugins: [react() as any],
  base: '/scoundrel/'
}) 