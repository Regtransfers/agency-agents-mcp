#!/usr/bin/env bash
# -------------------------------------------------------------------
# Agency Agents MCP — Automated Installer
#
# Run this from the cloned repo root:
#   chmod +x install.sh && ./install.sh
#
# What it does:
#   1. Checks prerequisites (Node >= 18, npm, git)
#   2. Downloads agent persona Markdown files from the upstream repo
#   3. Installs the MCP server and its dependencies to ~/.github/mcp-servers/agency-agents/
#   4. Writes the Copilot MCP config for your IDE (Rider, VS Code, or both)
#   5. Prints next steps
# -------------------------------------------------------------------
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No colour

AGENTS_DIR="$HOME/.github/agents"
SERVER_DIR="$HOME/.github/mcp-servers/agency-agents"
SHARED_INSTRUCTIONS_DIR="$HOME/.github/shared-instructions"
AGENTS_REPO="https://github.com/msitarzewski/agency-agents.git"

# ── Helpers ──────────────────────────────────────────────────────────
info()  { echo -e "${GREEN}[INFO]${NC}  $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
fail()  { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

check_command() {
  command -v "$1" &>/dev/null || fail "'$1' is required but not installed. Install it and re-run."
}

version_ge() {
  # Returns 0 (true) if $1 >= $2 (semver major only)
  local have="$1" need="$2"
  [ "$(printf '%s\n' "$need" "$have" | sort -V | head -n1)" = "$need" ]
}

# ── Prerequisites ────────────────────────────────────────────────────
info "Checking prerequisites..."

check_command node
check_command npm
check_command git

NODE_VERSION=$(node -v | sed 's/^v//')
if ! version_ge "$NODE_VERSION" "18.0.0"; then
  fail "Node.js >= 18 is required. Found v$NODE_VERSION."
fi
info "Node.js v$NODE_VERSION — OK"

# Resolve the absolute path to the node binary.
# IDEs (Rider, VS Code) do NOT inherit your shell's PATH, so "node" alone
# will fail if it was installed via nvm, fnm, nodenv, Homebrew, etc.
NODE_BIN="$(command -v node)"
# Follow symlinks to get the real path (works on Linux and macOS)
if command -v readlink &>/dev/null && readlink -f "$NODE_BIN" &>/dev/null; then
  NODE_BIN="$(readlink -f "$NODE_BIN")"
fi
info "Using node binary: $NODE_BIN"

# ── Step 1: Download agent definitions ───────────────────────────────
if [ -d "$AGENTS_DIR" ] && [ "$(ls -A "$AGENTS_DIR"/*.md 2>/dev/null | wc -l)" -gt 0 ]; then
  EXISTING=$(ls "$AGENTS_DIR"/*.md 2>/dev/null | wc -l)
  info "Agent definitions directory already exists with $EXISTING agents."
  read -rp "    Overwrite with latest from upstream? [y/N] " answer
  if [[ "${answer,,}" != "y" ]]; then
    info "Keeping existing agents."
  else
    info "Updating agents from $AGENTS_REPO ..."
    TMPDIR=$(mktemp -d)
    git clone --depth 1 "$AGENTS_REPO" "$TMPDIR" 2>/dev/null
    cp "$TMPDIR"/agents/*.md "$AGENTS_DIR/"
    rm -rf "$TMPDIR"
    info "$(ls "$AGENTS_DIR"/*.md | wc -l) agents installed."
  fi
else
  info "Downloading agent definitions from $AGENTS_REPO ..."
  mkdir -p "$AGENTS_DIR"
  TMPDIR=$(mktemp -d)
  git clone --depth 1 "$AGENTS_REPO" "$TMPDIR" 2>/dev/null
  cp "$TMPDIR"/agents/*.md "$AGENTS_DIR/"
  rm -rf "$TMPDIR"
  info "$(ls "$AGENTS_DIR"/*.md | wc -l) agents installed to $AGENTS_DIR"
fi

# ── Step 1b: Install shared instructions ─────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ -d "$SHARED_INSTRUCTIONS_DIR" ] && [ "$(ls -A "$SHARED_INSTRUCTIONS_DIR"/*.md 2>/dev/null | wc -l)" -gt 0 ]; then
  EXISTING_SI=$(ls "$SHARED_INSTRUCTIONS_DIR"/*.md 2>/dev/null | wc -l)
  info "Shared instructions directory already exists with $EXISTING_SI file(s)."
  read -rp "    Overwrite with defaults from this repo? [y/N] " si_answer
  if [[ "${si_answer,,}" != "y" ]]; then
    info "Keeping existing shared instructions."
  else
    info "Updating shared instructions..."
    cp "$SCRIPT_DIR"/shared-instructions/*.md "$SHARED_INSTRUCTIONS_DIR/"
    info "Shared instructions updated."
  fi
else
  info "Installing shared instructions to $SHARED_INSTRUCTIONS_DIR ..."
  mkdir -p "$SHARED_INSTRUCTIONS_DIR"
  cp "$SCRIPT_DIR"/shared-instructions/*.md "$SHARED_INSTRUCTIONS_DIR/"
  info "$(ls "$SHARED_INSTRUCTIONS_DIR"/*.md | wc -l) shared instruction file(s) installed."
fi

# ── Step 2: Install MCP server ───────────────────────────────────────
info "Installing MCP server to $SERVER_DIR ..."
mkdir -p "$SERVER_DIR"

cp "$SCRIPT_DIR/server.mjs"   "$SERVER_DIR/server.mjs"
cp "$SCRIPT_DIR/package.json" "$SERVER_DIR/package.json"

info "Running npm install (this may take a moment)..."
if ! (cd "$SERVER_DIR" && npm install --production 2>&1); then
  fail "npm install failed. Check the output above."
fi
info "MCP server installed."

# ── Step 3: Verify server starts ─────────────────────────────────────
info "Verifying server starts..."
SERVER_ERR=$(timeout 3 "$NODE_BIN" "$SERVER_DIR/server.mjs" </dev/null 2>&1 || true)
# The server is expected to time out (it blocks on stdin).
# If it printed an error (e.g. missing module), show it.
if echo "$SERVER_ERR" | grep -qi "error\|cannot find\|MODULE_NOT_FOUND"; then
  fail "Server failed to start:\n$SERVER_ERR"
fi
info "Server starts OK."

# ── Step 4: Write Copilot MCP config ─────────────────────────────────
write_mcp_config() {
  local config_dir="$1"
  local ide_name="$2"
  local config_file="$config_dir/mcp.json"

  mkdir -p "$config_dir"

  # Build the JSON with the fully resolved node path and home directory
  local config
  config=$(cat <<MCPJSON
{
    "servers": {
        "agency-agents": {
            "type": "stdio",
            "command": "$NODE_BIN",
            "args": ["$SERVER_DIR/server.mjs"],
            "env": {
                "AGENTS_DIR": "$AGENTS_DIR",
                "SHARED_INSTRUCTIONS_DIR": "$SHARED_INSTRUCTIONS_DIR"
            }
        }
    }
}
MCPJSON
)

  if [ -f "$config_file" ]; then
    # Check if agency-agents is already configured
    if grep -q "agency-agents" "$config_file" 2>/dev/null; then
      info "$ide_name config already contains agency-agents — skipping."
      return
    else
      warn "$ide_name config exists at $config_file but does not contain agency-agents."
      warn "You will need to manually merge the following into your existing config:"
      echo ""
      echo "$config"
      echo ""
      return
    fi
  fi

  echo "$config" > "$config_file"
  info "$ide_name MCP config written to $config_file"
}

echo ""
info "Which IDE(s) do you use with GitHub Copilot?"
echo "    1) JetBrains Rider / IntelliJ"
echo "    2) VS Code"
echo "    3) Both"
echo "    4) Skip — I'll configure manually"
read -rp "    Choice [1-4]: " ide_choice

case "${ide_choice}" in
  1)
    write_mcp_config "$HOME/.config/github-copilot/intellij" "Rider/IntelliJ"
    ;;
  2)
    write_mcp_config "$HOME/.config/github-copilot/vscode" "VS Code"
    ;;
  3)
    write_mcp_config "$HOME/.config/github-copilot/intellij" "Rider/IntelliJ"
    write_mcp_config "$HOME/.config/github-copilot/vscode" "VS Code"
    ;;
  4)
    info "Skipped IDE config. See README.md for manual setup."
    ;;
  *)
    warn "Unrecognised choice. Skipped IDE config. See README.md for manual setup."
    ;;
esac

# ── Done ─────────────────────────────────────────────────────────────
echo ""
echo "========================================"
info "Installation complete."
echo "========================================"
echo ""
echo "  Agents directory:             $AGENTS_DIR"
echo "  Shared instructions directory: $SHARED_INSTRUCTIONS_DIR"
echo "  MCP server:                    $SERVER_DIR/server.mjs"
echo ""
echo "  Next steps:"
echo "    1. Restart your IDE (Rider / VS Code)"
echo "    2. Open Copilot Chat in agent mode"
echo "    3. Try: 'List available agents'"
echo "    4. Try: 'Activate the backend architect agent'"
echo ""
echo "  To add a custom agent, drop a .md file into $AGENTS_DIR and restart the IDE."
echo "  To customise shared instructions, edit files in $SHARED_INSTRUCTIONS_DIR and restart the IDE."
echo ""

