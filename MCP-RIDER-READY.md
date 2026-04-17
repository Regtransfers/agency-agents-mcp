# MCP Setup Complete for Rider 2025.3+ (GitHub Copilot)

## ✅ Setup Status: WORKING

The MCP (Model Context Protocol) integration is **fully configured and operational** for JetBrains Rider 2025.3+ with GitHub Copilot.

## 🎯 What's Been Configured

### 1. MCP HTTP Bridge (`~/.local/bin/mcp-http-bridge`)
- ✅ Downloaded and installed
- ✅ Executable permissions set
- ✅ Connects to: `https://agency-agents-mcp.regtransfers.dev`

### 2. Wrapper Script (`~/.local/bin/mcp-agency-agents`)
```bash
#!/bin/bash
export MCP_URL="https://agency-agents-mcp.regtransfers.dev"
exec ~/.local/bin/mcp-http-bridge "$@"
```
- ✅ Created with proper environment variable
- ✅ Executable permissions set
- ✅ Uses `exec` to replace shell process (required for proper stdio handling)

### 3. Rider MCP Configuration (`~/.config/JetBrains/Rider2025.3/mcp_config.json`)
```json
{
  "mcpServers": {
    "agency-agents": {
      "command": "/home/USERNAME/.local/bin/mcp-agency-agents",
      "args": []
    }
  }
}
```
- ✅ Points to wrapper script (absolute path)
- ✅ No additional args needed (wrapper handles env var)

### 4. MCP Server Status (`~/.config/JetBrains/Rider2025.3/options/llm.mcpServers.xml`)
```xml
<option name="enabled" value="true" />
<option name="name" value="agency-agents" />
```
- ✅ Server is enabled
- ✅ Registered as "agency-agents"

## 🚀 How It Works

### On-Demand Activation
The MCP server operates on-demand to save system resources:

1. **Rider starts** → Loads MCP configuration
2. **You open Copilot Chat** → Rider spawns the MCP server process
3. **Server initializes** → Connects to remote server via HTTP bridge
4. **Tools are loaded** → 9 tools become available to Copilot
5. **Conversation ends** → Server stops to free resources
6. **New conversation** → Server restarts automatically

### Available Tools
When active, the following 9 tools are exposed to GitHub Copilot:

**Agent Tools:**
- `list_agents` - List all 160+ agent personas
- `activate_agent` - Load a specialist agent persona
- `search_agents` - Search agents by keyword
- `get_shared_instructions` - View baseline standards

**Skill Tools:**
- `list_skills` - List all 1,400+ specialized skills
- `activate_skill` - Load a specialized skill
- `search_skills` - Search skills by keyword
- `get_skill_categories` - View skill categories

**System Tools:**
- `healthz` - Health check endpoint

## 📊 Verification

### Test the Wrapper Script
```bash
~/.local/bin/mcp-agency-agents <<< '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

**Expected output:**
```json
{"result":{"tools":[{"name":"list_agents",...},{"name":"activate_agent",...},...]},"jsonrpc":"2.0","id":1}
```

### Check MCP Logs
```bash
# View recent MCP activity
tail -50 ~/.cache/JetBrains/Rider2025.3/log/mcp/agency-agents.log
```

**Successful connection shows:**
```
INFO - Server started
CLIENT - {"method":"initialize",...}
SERVER - {"result":{"protocolVersion":"2025-06-18",...}}
CLIENT - {"method":"tools/list",...}
SERVER - {"result":{"tools":[...]}}
```

### Test in Copilot Chat
Open GitHub Copilot Chat in Rider and ask:
```
List available agents
```

**You should see:** 160+ agent personas loaded from the remote server.

## 🔧 Troubleshooting

### Issue: "I don't have access to those MCP tools"

**Solution:**
1. **Start a NEW Copilot conversation** (click "+" in Copilot Chat)
   - This is the most common fix!
   - MCP tools load per-conversation, not globally

2. **If still not working:**
   ```bash
   # Verify wrapper script works
   ~/.local/bin/mcp-agency-agents <<< '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
   # Should return JSON with 9 tools
   ```

3. **Check Rider logs:**
   ```bash
   tail -50 ~/.cache/JetBrains/Rider2025.3/log/mcp/agency-agents.log
   ```

4. **Verify config file:**
   ```bash
   cat ~/.config/JetBrains/Rider2025.3/mcp_config.json
   # Should show the wrapper script path
   ```

5. **Restart Rider completely**
   - Rider only loads MCP config at startup

### Issue: Wrapper script not found

```bash
# Recreate wrapper script
cat > ~/.local/bin/mcp-agency-agents << 'EOF'
#!/bin/bash
export MCP_URL="https://agency-agents-mcp.regtransfers.dev"
exec ~/.local/bin/mcp-http-bridge "$@"
EOF
chmod +x ~/.local/bin/mcp-agency-agents
```

### Issue: Bridge script not found

```bash
# Download bridge script
curl -o ~/.local/bin/mcp-http-bridge https://raw.githubusercontent.com/Regtransfers/agency-agents-mcp/main/mcp-http-bridge.mjs
chmod +x ~/.local/bin/mcp-http-bridge
```

### Issue: MCP server not connecting

**Check remote server is online:**
```bash
curl -X POST https://agency-agents-mcp.regtransfers.dev/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

**Should return:** JSON with tools array

### Issue: Switched projects - tools disappeared

**This is NORMAL behavior!** 

GitHub Copilot loads MCP tools per-conversation. When you switch projects:

1. **Old conversation** → Keeps tools from old project
2. **New conversation** → Loads tools for new project

**Solution:** Click "+" in Copilot Chat to start a fresh conversation.

## 📁 File Locations

### Configuration Files
- **Rider MCP Config**: `~/.config/JetBrains/Rider2025.3/mcp_config.json`
- **MCP Server Status**: `~/.config/JetBrains/Rider2025.3/options/llm.mcpServers.xml`
- **MCP Global Settings**: `~/.config/JetBrains/Rider2025.3/options/mcpServer.xml`

### Scripts
- **Wrapper**: `~/.local/bin/mcp-agency-agents`
- **Bridge**: `~/.local/bin/mcp-http-bridge`

### Logs
- **MCP Logs**: `~/.cache/JetBrains/Rider2025.3/log/mcp/agency-agents.log`
- **Rider Logs**: `~/.cache/JetBrains/Rider2025.3/log/idea.log`
- **Backend Logs**: `~/.cache/JetBrains/Rider2025.3/log/backend.*.log`

## 🎓 Usage Examples

### Activate an Agent
```
Activate the backend architect agent and review my API design
```

### Search for Agents
```
Search for agents about security
```

### List Skills
```
List skills in the testing category
```

### Combine Agent + Skills
```
Activate the backend architect agent, then use the api-design-principles 
and test-driven-development skills to help me build a payment API
```

## 🔍 Diagnostic Commands

### Full System Check
```bash
echo "=== Wrapper Script ===" && \
cat ~/.local/bin/mcp-agency-agents && \
echo -e "\n=== Rider MCP Config ===" && \
cat ~/.config/JetBrains/Rider2025.3/mcp_config.json && \
echo -e "\n=== MCP Server Status ===" && \
cat ~/.config/JetBrains/Rider2025.3/options/llm.mcpServers.xml && \
echo -e "\n=== Manual Test ===" && \
~/.local/bin/mcp-agency-agents <<< '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' 2>&1 | head -20
```

### Check All Permissions
```bash
ls -l ~/.local/bin/mcp-* ~/.config/JetBrains/Rider2025.3/mcp_config.json
```

### Watch Logs in Real-Time
```bash
tail -f ~/.cache/JetBrains/Rider2025.3/log/mcp/agency-agents.log
```

## 📚 Additional Documentation

- **[README.md](README.md)** - Full project documentation
- **[QUICK-REFERENCE.md](QUICK-REFERENCE.md)** - Top 10 skills and workflows
- **[SKILLS-GUIDE.md](SKILLS-GUIDE.md)** - Complete skills catalog
- **[HEALTHZ-RPC.md](HEALTHZ-RPC.md)** - Health check documentation

## ✨ What's Next?

Your setup is complete! Start using the agents and skills in GitHub Copilot:

1. **Open Copilot Chat** in Rider
2. **Ask:** "List available agents"
3. **Activate an agent:** "Be a backend architect"
4. **Use a skill:** "Activate the test-driven-development skill"

The server will automatically start when needed and stop when idle to save resources.

---

**Last Updated:** April 16, 2026  
**Status:** ✅ Fully Operational

