#!/bin/bash
set -e

DENO_VERSION="v2.7.5"

# Skip if Deno is already installed at the correct version
if command -v deno &> /dev/null && deno --version | head -1 | grep -q "2.7.5"; then
  echo "Deno ${DENO_VERSION} already installed"
  exit 0
fi

echo "Installing Deno ${DENO_VERSION}..."
curl -fsSL https://deno.land/install.sh | DENO_INSTALL=/usr/local sh -s -- "${DENO_VERSION}"

# Verify installation
deno --version
echo "Deno installation complete"
