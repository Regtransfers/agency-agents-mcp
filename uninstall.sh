#!/usr/bin/env bash
# -------------------------------------------------------------------
# Uninstaller — removes agents, MCP server, and Copilot MCP config
# -------------------------------------------------------------------
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info()  { echo -e "${GREEN}[INFO]${NC}  $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }

AGENTS_DIR="$HOME/.github/agents"
SERVER_DIR="$HOME/.github/mcp-servers/agency-agents"
SHARED_INSTRUCTIONS_DIR="$HOME/.github/shared-instructions"

echo ""
echo "This will remove:"
echo "  - Agent definitions:      $AGENTS_DIR"
echo "  - Shared instructions:    $SHARED_INSTRUCTIONS_DIR"
echo "  - MCP server:             $SERVER_DIR"
echo "  - agency-agents entry from Copilot MCP configs"
echo ""
read -rp "Continue? [y/N] " answer
if [[ "${answer,,}" != "y" ]]; then
  echo "Aborted."
  exit 0
fi

# Remove agents
if [ -d "$AGENTS_DIR" ]; then
  rm -rf "$AGENTS_DIR"
  info "Removed $AGENTS_DIR"
else
  info "No agents directory found."
fi

# Remove shared instructions
if [ -d "$SHARED_INSTRUCTIONS_DIR" ]; then
  rm -rf "$SHARED_INSTRUCTIONS_DIR"
  info "Removed $SHARED_INSTRUCTIONS_DIR"
else
  info "No shared instructions directory found."
fi

# Remove server
if [ -d "$SERVER_DIR" ]; then
  rm -rf "$SERVER_DIR"
  info "Removed $SERVER_DIR"
else
  info "No MCP server directory found."
fi

# Clean up empty parent dirs
rmdir "$HOME/.github/mcp-servers" 2>/dev/null || true

# Note about MCP configs — don't delete them wholesale since the user may have other servers
for config in "$HOME/.config/github-copilot/intellij/mcp.json" "$HOME/.config/github-copilot/vscode/mcp.json"; do
  if [ -f "$config" ] && grep -q "agency-agents" "$config" 2>/dev/null; then
    warn "MCP config at $config still references agency-agents."
    warn "Edit it manually to remove the 'agency-agents' server block, or delete the file if it was the only entry."
  fi
done

echo ""
info "Uninstall complete. Restart your IDE to apply."

