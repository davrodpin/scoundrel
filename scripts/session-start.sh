#!/bin/bash
set -e

# Only run in cloud environments
if [ "$CLAUDE_CODE_REMOTE" != "true" ]; then
  exit 0
fi

echo "=== Scoundrel Session Start ==="

echo "Installing Deno dependencies..."
deno install --allow-scripts

echo "Generating Prisma client..."
deno task prisma:generate

echo "=== Session Start Complete ==="
