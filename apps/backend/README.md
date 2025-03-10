# Scoundrel Backend

## Environment Setup

### Development
1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Adjust variables in `.env` as needed

### Production (Render.com)
Required environment variables in Render dashboard:
- `NODE_ENV=production`
- `PORT` (usually set automatically by Render)
- `ALLOWED_ORIGINS=https://davrodpin.github.io`

See `.env.production.example` for reference.

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

## Production

The service is automatically deployed to Render.com when changes are pushed to the main branch.
Make sure all required environment variables are set in the Render dashboard. 