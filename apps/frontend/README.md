# Scoundrel Frontend

## Environment Setup

### Development
1. Copy `.env.example` to `.env.development`:
   ```bash
   cp .env.example .env.development
   ```
2. Adjust variables in `.env.development` as needed

### Production
Environment variables for production are automatically set by the GitHub Actions workflow.
See `.github/workflows/deploy.yml` for the configuration.

Current production settings:
- `VITE_NODE_ENV=production`
- `VITE_BACKEND_URL=https://scoundrel-backend.onrender.com`

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

## Production

The frontend is automatically deployed to GitHub Pages when the GitHub Actions workflow is manually triggered.
Environment variables are set during the build process in the workflow. 