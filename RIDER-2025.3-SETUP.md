# Rider 2025.3 MCP Setup Guide

## What Changed in Rider 2025.3

JetBrains changed the MCP configuration location in Rider 2025.3:
- **Old location:** `~/.config/github-copilot/intellij/mcp.json`
- **New location:** `~/.config/JetBrains/Rider2025.3/mcp_config.json`

The new config also requires a wrapper script because it doesn't support environment variables directly in the JSON.

---

## Complete Setup (3 Files Required)

### File 1: HTTP Bridge Script
**Location:** `~/.local/bin/mcp-http-bridge`

This file should already exist from the main setup. If not:
```bash
mkdir -p ~/.local/bin
curl -o ~/.local/bin/mcp-http-bridge https://raw.githubusercontent.com/Regtransfers/agency-agents-mcp/main/mcp-http-bridge.mjs
chmod +x ~/.local/bin/mcp-http-bridge
```

### File 2: Wrapper Script (NEW)
**Location:** `~/.local/bin/mcp-agency-agents`

```bash
cat > ~/.local/bin/mcp-agency-agents << 'EOF'
#!/bin/bash
export MCP_URL="https://agency-agents-mcp.regtransfers.dev"
exec /home/$USER/.local/bin/mcp-http-bridge "$@"
EOF
chmod +x ~/.local/bin/mcp-agency-agents
```

**What it does:** Sets the environment variable and executes the HTTP bridge.

### File 3: Rider MCP Config (NEW)
**Location:** `~/.config/JetBrains/Rider2025.3/mcp_config.json`

```bash
mkdir -p ~/.config/JetBrains/Rider2025.3
cat > ~/.config/JetBrains/Rider2025.3/mcp_config.json << 'EOF'
{
  "mcpServers": {
    "agency-agents": {
      "command": "/home/$USER/.local/bin/mcp-agency-agents",
      "args": []
    }
  }
}
EOF
```

**Important:** Replace `$USER` with your actual username in the command path, or use the full absolute path.

---

## Quick Copy-Paste Setup

Run all three commands in sequence:

```bash
# 1. Download HTTP bridge (if not already done)
mkdir -p ~/.local/bin
curl -o ~/.local/bin/mcp-http-bridge https://raw.githubusercontent.com/Regtransfers/agency-agents-mcp/main/mcp-http-bridge.mjs
chmod +x ~/.local/bin/mcp-http-bridge

# 2. Create wrapper script
cat > ~/.local/bin/mcp-agency-agents << 'EOF'
#!/bin/bash
export MCP_URL="https://agency-agents-mcp.regtransfers.dev"
exec /home/$USER/.local/bin/mcp-http-bridge "$@"
EOF
chmod +x ~/.local/bin/mcp-agency-agents

# 3. Create Rider config
mkdir -p ~/.config/JetBrains/Rider2025.3
cat > ~/.config/JetBrains/Rider2025.3/mcp_config.json << 'EOF'
{
  "mcpServers": {
    "agency-agents": {
      "command": "/home/$USER/.local/bin/mcp-agency-agents",
      "args": []
    }
  }
}
EOF

# 4. Restart Rider
echo "✅ Setup complete! Restart Rider to load the MCP server."
```

---

## Verification

After restarting Rider:

1. **Check logs:**
   ```bash
   cat ~/.cache/JetBrains/Rider2025.3/log/mcp/agency-agents.log
   ```
   
   Should see:
   ```
   Server started
   {"result":{"protocolVersion":"2025-06-18","capabilities":{"tools":{"listChanged":true}},...
   ```

2. **Test in Copilot Chat:**
   ```
   List available agents
   ```
   
   Should return 135+ agents.

3. **Test skills:**
   ```
   List available skills
   ```
   
   Should return 1412 skills.

---

## Troubleshooting

### MCP server not loading
- Check that wrapper script is executable: `ls -la ~/.local/bin/mcp-agency-agents`
- Verify config file exists: `cat ~/.config/JetBrains/Rider2025.3/mcp_config.json`
- Check logs: `tail -f ~/.cache/JetBrains/Rider2025.3/log/mcp/agency-agents.log`

### "Server stopped" in logs
This is normal - MCP servers start on-demand and stop when idle.

### No tools showing in Copilot
- Restart Rider completely (close all windows)
- Check GitHub Copilot settings in Rider point to the config file
- Verify the remote server is up: `curl https://agency-agents-mcp.regtransfers.dev/healthz`

---

## What Gets Created

After setup, you'll have:

```
~/.local/bin/
  ├── mcp-http-bridge              # HTTP-to-stdio bridge
  └── mcp-agency-agents            # Wrapper script (NEW)

~/.config/JetBrains/Rider2025.3/
  └── mcp_config.json              # Rider MCP config (NEW)

~/.cache/JetBrains/Rider2025.3/log/mcp/
  └── agency-agents.log            # MCP server logs
```

---

## Migration from Older Riders

If you previously used `~/.config/github-copilot/intellij/mcp.json`:

1. That config still works for older Rider versions
2. Rider 2025.3 ignores it - use the new location
3. You can keep both configs if you use multiple Rider versions
4. The wrapper script approach is cleaner and works for all versions

---

## Files Summary

| File | Purpose | Required? |
|------|---------|-----------|
| `~/.local/bin/mcp-http-bridge` | Connects to remote MCP server | ✅ Yes |
| `~/.local/bin/mcp-agency-agents` | Wrapper with environment variables | ✅ Yes (Rider 2025.3+) |
| `~/.config/JetBrains/Rider2025.3/mcp_config.json` | Rider MCP configuration | ✅ Yes (Rider 2025.3+) |

---

## Success Indicators

✅ **Working Setup:**
- Wrapper script is executable and contains correct MCP_URL
- Config file exists with correct command path
- Rider logs show "Server started" and tools list
- Copilot chat responds to "List available agents"
- 9 MCP tools available (list_agents, activate_agent, etc.)

❌ **Common Issues:**
- Wrapper script not executable (`chmod +x` fixes this)
- Wrong path in config (use absolute paths, no `~`)
- Rider not restarted after config changes
- Remote server is down (check with curl)

