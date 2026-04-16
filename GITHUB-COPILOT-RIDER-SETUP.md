# GitHub Copilot + Rider 2025.3 - MCP Setup Guide (UPDATED)

## Critical Setup Requirements

Rider 2025.3 with GitHub Copilot requires **BOTH** configuration files:
1. `~/.config/JetBrains/Rider2025.3/mcp_config.json` - Rider's MCP config
2. `~/.config/github-copilot/mcp-config.json` - GitHub Copilot's MCP config

Plus a **wrapper script** that executes the bridge with the correct environment.

---

## One-Time Setup (Linux/macOS/WSL)

### Step 1: Download the HTTP-to-stdio bridge

```bash
mkdir -p ~/.local/bin
curl -o ~/.local/bin/mcp-http-bridge https://raw.githubusercontent.com/Regtransfers/agency-agents-mcp/main/mcp-http-bridge.mjs
chmod +x ~/.local/bin/mcp-http-bridge
```

### Step 2: Create the wrapper script

**CRITICAL:** The wrapper must use `exec` to properly forward the MCP bridge process:

```bash
cat > ~/.local/bin/mcp-agency-agents << 'EOF'
#!/bin/bash
export MCP_URL="https://agency-agents-mcp.regtransfers.dev"
exec ~/.local/bin/mcp-http-bridge "$@"
EOF
chmod +x ~/.local/bin/mcp-agency-agents
```

Replace `$HOME` with your actual home directory:
```bash
cat > ~/.local/bin/mcp-agency-agents << EOF
#!/bin/bash
export MCP_URL="https://agency-agents-mcp.regtransfers.dev"
exec $HOME/.local/bin/mcp-http-bridge "\$@"
EOF
chmod +x ~/.local/bin/mcp-agency-agents
```

### Step 3: Create the Rider MCP config

```bash
mkdir -p ~/.config/JetBrains/Rider2025.3
cat > ~/.config/JetBrains/Rider2025.3/mcp_config.json << EOF
{
  "mcpServers": {
    "agency-agents": {
      "command": "$HOME/.local/bin/mcp-agency-agents",
      "args": []
    }
  }
}
EOF
```

### Step 4: Create the GitHub Copilot MCP config

```bash
mkdir -p ~/.config/github-copilot
cat > ~/.config/github-copilot/mcp-config.json << EOF
{
  "servers": {
    "agency-agents": {
      "command": "$HOME/.local/bin/mcp-agency-agents",
      "args": []
    }
  }
}
EOF
```

### Step 5: Test the wrapper script

Before restarting Rider, verify the wrapper works:

```bash
~/.local/bin/mcp-agency-agents <<< '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

**Expected output:** JSON response containing 9 tools (list_agents, activate_agent, search_agents, etc.)

If you see an error, check that:
- `~/.local/bin/mcp-http-bridge` exists and is executable
- The wrapper script has `exec ~/.local/bin/mcp-http-bridge "$@"` (not missing the `exec` or the `"$@"`)

### Step 6: Restart Rider completely

Close Rider fully and restart it. GitHub Copilot only loads MCP configurations at startup.

### Step 7: Verify in GitHub Copilot Chat

Open GitHub Copilot Chat and test:
```
List available agents
```

You should see **144+ agent personas** loaded from the remote server.

---

## Daily Workflow

### When You Switch Projects

**Every time you open a different project in Rider:**

1. Click the **"+"** icon in Copilot Chat (top-right)
2. Start a fresh conversation
3. MCP tools are now available

**You do NOT need to restart Rider** - just start a new conversation.

---

## Troubleshooting

### Tools still not showing?

**1. Verify the config file exists:**
```bash
cat ~/.config/github-copilot/intellij/mcp.json
```
Should show the JSON config with `agency-agents` server.

**2. Test the bridge manually:**
```bash
MCP_URL="https://agency-agents-mcp.regtransfers.dev" ~/.local/bin/mcp-http-bridge
```
Then paste this JSON and press Enter:
```json
{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}
```
Should return JSON with `"tools"` in the response.

**3. Check if the bridge is running:**
```bash
ps aux | grep mcp-http-bridge | grep -v grep
```
Should show a node process running the bridge.

**4. Check Rider logs:**
```bash
tail -f ~/.cache/JetBrains/Rider2025.3/log/idea.log | grep -i "mcp\|agency"
```
Look for "MCP Extension Service" or "agency-agents" mentions.

### Still broken?

1. **Kill any existing bridge processes:**
   ```bash
   pkill -f mcp-http-bridge
   ```

2. **Restart Rider completely**

3. **Start a NEW Copilot conversation** (click +)

4. **Try again:** `List available agents`

---

## What You Get

Once configured, you have access to:

- **144 agent personas** (backend-architect, security-engineer, ux-designer, etc.)
- **1,412 specialized skills** (brainstorming, TDD, API design, Kubernetes, etc.)
- **10 MCP tools** to list, search, and activate agents/skills

### Example Commands

```
List available agents
Activate the backend-architect agent
Search for agents about security
List engineering agents

List available skills
Activate the brainstorming skill
Search for skills about testing
List skills in the devops category
```

### Combining Agents + Skills

The real power is combining them:

```
Activate the backend-architect agent, then use the api-design-principles 
and test-driven-development skills to help me build a new payment API 
with comprehensive tests
```

---

## Technical Details

### How It Works

1. **Config location:** `~/.config/github-copilot/intellij/mcp.json`
2. **Bridge script:** `~/.local/bin/mcp-http-bridge` (Node.js script)
3. **Remote server:** `https://agency-agents-mcp.regtransfers.dev`
4. **Protocol:** MCP (Model Context Protocol) over stdio
5. **Scope:** Per-conversation (tools loaded when conversation starts)

### Why the specific config location?

- **Rider 2025.3+** ships with a built-in MCP Server plugin (`com.intellij.mcpServer`)
- **GitHub Copilot** plugin (`com.github.copilot`) uses its own config folder
- The two are **separate** - GitHub Copilot reads `~/.config/github-copilot/intellij/mcp.json`
- The JetBrains MCP plugin reads `~/.config/JetBrains/Rider2025.3/mcp_config.json` (different!)

### Why per-conversation?

GitHub Copilot initializes MCP tools when it starts a new conversation. This means:
- ✅ Fresh conversations = fresh tool state
- ❌ Old conversations = stale tool state
- 🔄 Switching projects = start new conversation to reload tools

---

## Windows Setup

For Windows users, use PowerShell:

```powershell
# Download bridge
$bridgeDir = "$env:LOCALAPPDATA\mcp-bridge"
New-Item -ItemType Directory -Force -Path $bridgeDir | Out-Null
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/Regtransfers/agency-agents-mcp/main/mcp-http-bridge.mjs" -OutFile "$bridgeDir\mcp-http-bridge.mjs"

# Configure GitHub Copilot in Rider
$configPath = "$env:APPDATA\JetBrains\Rider2025.3\options\llm.mcpServers.xml"
$configDir = Split-Path -Parent $configPath
New-Item -ItemType Directory -Force -Path $configDir | Out-Null

@"
<application>
  <component name="McpApplicationServerCommands" modifiable="true" autoEnableExternalChanges="false">
    <commands>
      <McpServerConfigurationProperties>
        <option name="allowedToolsNames" />
        <option name="command" value="node" />
        <option name="args">
          <list>
            <option value="$bridgeDir\mcp-http-bridge.mjs" />
          </list>
        </option>
        <option name="enabled" value="true" />
        <option name="env">
          <map>
            <entry key="MCP_URL" value="https://agency-agents-mcp.regtransfers.dev" />
          </map>
        </option>
        <option name="name" value="agency-agents" />
      </McpServerConfigurationProperties>
    </commands>
    <urls />
  </component>
</application>
"@ | Set-Content $configPath
```

Then restart Rider.

---

## Quick Reference

| Issue | Solution |
|-------|----------|
| Switched projects | Start a NEW Copilot conversation (click +) |
| Tools not loading after restart | Verify config at `~/.config/JetBrains/Rider2025.3/options/llm.mcpServers.xml` has `<option name="command">` |
| "Found 0 existing MCP providers" in logs | The XML config is missing the command option - update `llm.mcpServers.xml` with the full setup above |
| Bridge not connecting | Test manually: `MCP_URL="https://agency-agents-mcp.regtransfers.dev" ~/.local/bin/mcp-http-bridge` |
| Config changes not applying | Restart Rider completely, then start a new conversation |

**Remember:** Click the **"+"** icon in Copilot Chat when switching projects! 🔥



