# MCP Troubleshooting Guide for Rider 2025.3+

## 🚨 Most Common Issues (95% of problems)

### 1. "Tools disappeared after switching projects"
**Cause:** GitHub Copilot loads MCP tools per-conversation, not globally.

**Solution:** 
```
Click the "+" icon in Copilot Chat to start a NEW conversation
```

That's it! This fixes 80% of all reported issues.

---

### 2. "I don't have access to those MCP tools"
**Cause:** MCP server not started or config not loaded.

**Solution (try in order):**

**Step 1:** Start a new Copilot conversation (click "+")

**Step 2:** Restart Rider completely
- Close all Rider windows
- Wait 5 seconds
- Reopen Rider

**Step 3:** Verify wrapper script works
```bash
~/.local/bin/mcp-agency-agents <<< '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

**Expected:** JSON output with 9 tools

**If this fails:** Your setup is broken. Continue to Step 4.

**Step 4:** Check config file exists
```bash
cat ~/.config/JetBrains/Rider2025.3/mcp_config.json
```

**Expected:** Should show the wrapper script path

**If missing:** Recreate config (see Setup section below)

---

### 3. "Wrapper script returns error"
**Cause:** Bridge script missing or not executable.

**Solution:**
```bash
# Check if bridge exists
ls -l ~/.local/bin/mcp-http-bridge

# If missing, download it
curl -o ~/.local/bin/mcp-http-bridge https://raw.githubusercontent.com/Regtransfers/agency-agents-mcp/main/mcp-http-bridge.mjs
chmod +x ~/.local/bin/mcp-http-bridge
```

---

## 🔧 Complete Setup (If Starting Fresh)

### Step 1: Download Bridge Script
```bash
mkdir -p ~/.local/bin
curl -o ~/.local/bin/mcp-http-bridge https://raw.githubusercontent.com/Regtransfers/agency-agents-mcp/main/mcp-http-bridge.mjs
chmod +x ~/.local/bin/mcp-http-bridge
```

### Step 2: Create Wrapper Script
```bash
cat > ~/.local/bin/mcp-agency-agents << 'EOF'
#!/bin/bash
export MCP_URL="https://agency-agents-mcp.regtransfers.dev"
exec ~/.local/bin/mcp-http-bridge "$@"
EOF
chmod +x ~/.local/bin/mcp-agency-agents
```

### Step 3: Create Rider Config
**Replace `YOUR_USERNAME` with your actual username!**

```bash
mkdir -p ~/.config/JetBrains/Rider2025.3
cat > ~/.config/JetBrains/Rider2025.3/mcp_config.json << 'EOF'
{
  "mcpServers": {
    "agency-agents": {
      "command": "/home/YOUR_USERNAME/.local/bin/mcp-agency-agents",
      "args": []
    }
  }
}
EOF
```

**Or auto-detect username:**
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

### Step 4: Restart Rider
**CRITICAL:** Close Rider completely and reopen. Rider only loads MCP config at startup.

### Step 5: Test in Copilot
Open Copilot Chat and ask:
```
List available agents
```

You should see 160+ agents loaded.

---

## 🔍 Advanced Troubleshooting

### Check MCP Logs

**View recent activity:**
```bash
tail -50 ~/.cache/JetBrains/Rider2025.3/log/mcp/agency-agents.log
```

**What to look for:**

✅ **Good signs:**
```
INFO - Server started
CLIENT - {"method":"initialize",...}
SERVER - {"result":{"protocolVersion":"2025-06-18",...}}
CLIENT - {"method":"tools/list",...}
SERVER - {"result":{"tools":[...]}}
```

❌ **Bad signs:**
```
Error: ...
Connection refused
Permission denied
```

**If log file doesn't exist:** Rider hasn't tried to start MCP yet. Check your config files.

### Check Rider Logs

**Search for MCP errors:**
```bash
grep -i "mcp\|agency" ~/.cache/JetBrains/Rider2025.3/log/idea.log | tail -20
```

**Look for:**
- `McpToolsetHost` being initialized
- Error messages about MCP servers
- Connection failures

### Test Remote Server

**Verify the hosted server is online:**
```bash
curl -X POST https://agency-agents-mcp.regtransfers.dev/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

**Expected:** JSON response with tools array

**If this fails:** Remote server is down. Contact administrator or run locally instead.

### Check File Permissions

**All scripts must be executable:**
```bash
ls -l ~/.local/bin/mcp-*
```

**Expected:**
```
-rwxr-xr-x  ...  mcp-agency-agents
-rwxr-xr-x  ...  mcp-http-bridge
```

**If missing 'x' (execute) permission:**
```bash
chmod +x ~/.local/bin/mcp-agency-agents
chmod +x ~/.local/bin/mcp-http-bridge
```

---

## 📊 Diagnostic Report

**Run this to generate a full diagnostic report:**
```bash
echo "=== SYSTEM INFO ===" && \
echo "OS: $(uname -a)" && \
echo "Node: $(node -v 2>&1)" && \
echo "User: $(whoami)" && \
echo -e "\n=== WRAPPER SCRIPT ===" && \
cat ~/.local/bin/mcp-agency-agents 2>&1 && \
echo -e "\n=== WRAPPER PERMISSIONS ===" && \
ls -l ~/.local/bin/mcp-* 2>&1 && \
echo -e "\n=== RIDER MCP CONFIG ===" && \
cat ~/.config/JetBrains/Rider2025.3/mcp_config.json 2>&1 && \
echo -e "\n=== MCP SERVER STATUS ===" && \
cat ~/.config/JetBrains/Rider2025.3/options/llm.mcpServers.xml 2>&1 && \
echo -e "\n=== MANUAL WRAPPER TEST ===" && \
~/.local/bin/mcp-agency-agents <<< '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' 2>&1 | head -20 && \
echo -e "\n=== RECENT MCP LOGS ===" && \
tail -20 ~/.cache/JetBrains/Rider2025.3/log/mcp/agency-agents.log 2>&1
```

**Share this output when asking for help.**

---

## 🎯 Quick Tests

### Test 1: Wrapper Script
```bash
~/.local/bin/mcp-agency-agents <<< '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```
**Pass:** Returns JSON with 9 tools  
**Fail:** Error message or nothing

### Test 2: Bridge Script
```bash
MCP_URL="https://agency-agents-mcp.regtransfers.dev" ~/.local/bin/mcp-http-bridge <<< '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```
**Pass:** Returns JSON with 9 tools  
**Fail:** Error message

### Test 3: Remote Server
```bash
curl -s https://agency-agents-mcp.regtransfers.dev/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | grep -o '"name":"[^"]*"' | head -5
```
**Pass:** Shows tool names  
**Fail:** Empty or error

### Test 4: Config File
```bash
cat ~/.config/JetBrains/Rider2025.3/mcp_config.json
```
**Pass:** Shows valid JSON with wrapper path  
**Fail:** File not found or invalid JSON

---

## ❓ FAQ

### Q: Why does the server stop after I close Copilot Chat?
**A:** This is normal! Rider stops MCP servers when idle to save resources. The server will restart automatically when you open a new Copilot conversation.

### Q: Do I need to restart Rider every time?
**A:** Only when you change MCP config files. Once configured, the server starts automatically with each new Copilot conversation.

### Q: Can I use local agents instead of the remote server?
**A:** Yes! Clone the repo locally and update the wrapper script to point to `node server.mjs` instead of the HTTP bridge. See README.md for full local setup.

### Q: How do I know if Rider is loading MCP tools?
**A:** Check `~/.cache/JetBrains/Rider2025.3/log/mcp/agency-agents.log` for connection logs. Or just ask Copilot "List available agents" - if it works, MCP is loaded!

### Q: Why 9 tools instead of 10?
**A:** The README mentions "10 tools" but that's counting tool categories. The actual tools are:
1. list_agents
2. activate_agent
3. search_agents
4. get_shared_instructions
5. list_skills
6. activate_skill
7. search_skills
8. get_skill_categories
9. healthz

### Q: Does this work on Windows?
**A:** The setup above is for Linux/macOS. For Windows, see the PowerShell commands in README.md.

---

## 🆘 Still Having Issues?

1. **Run the diagnostic report** (see above)
2. **Check all Quick Tests** pass
3. **Review the MCP logs** for specific errors
4. **Restart Rider completely**
5. **Start a NEW Copilot conversation**

If still broken, share:
- The diagnostic report output
- Any error messages from MCP logs
- What you see when you ask Copilot "List available agents"

---

**Last Updated:** April 16, 2026  
**Related Docs:** [README.md](README.md) | [MCP-RIDER-READY.md](MCP-RIDER-READY.md)

