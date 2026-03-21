#!/bin/bash
set -e

# --- Deno ---
DENO_VERSION="v2.7.5"

if command -v deno &> /dev/null && deno --version | head -1 | grep -q "2.7.5"; then
  echo "Deno ${DENO_VERSION} already installed"
else
  echo "Installing Deno ${DENO_VERSION}..."
  curl -fsSL https://deno.land/install.sh | DENO_INSTALL=/usr/local sh -s -- "${DENO_VERSION}"
  deno --version
fi

# --- GitHub CLI ---
if command -v gh &> /dev/null; then
  echo "GitHub CLI already installed"
else
  echo "Installing GitHub CLI..."
  apt-get update -y
  apt-get install -y gh
fi
