# Rider 2025.3 + GitHub Copilot MCP - Quick Reference Card

## ⚡ One-Command Setup

Close Rider first, then run:

```bash
# Download bridge
mkdir -p ~/.local/bin
curl -o ~/.local/bin/mcp-http-bridge https://raw.githubusercontent.com/Regtransfers/agency-agents-mcp/main/mcp-http-bridge.mjs
chmod +x ~/.local/bin/mcp-http-bridge

# Create wrapper
cat > ~/.local/bin/mcp-agency-agents << 'EOF'
#!/bin/bash
export MCP_URL="https://agency-agents-mcp.regtransfers.dev"
exec ~/.local/bin/mcp-http-bridge "$@"
EOF
chmod +x ~/.local/bin/mcp-agency-agents

# Create GitHub Copilot MCP config
mkdir -p ~/.config/github-copilot/intellij
cat > ~/.config/github-copilot/intellij/mcp.json << 'EOF'
{
    "servers": {
        "agency-agents": {
            "type": "stdio",
            "command": "/home/$USER/.local/bin/mcp-agency-agents"
        }
    }
}
EOF

# CRITICAL: Tell GitHub Copilot where to find MCP config
cat > ~/.config/JetBrains/Rider2025.3/options/github-copilot.xml << 'EOF'
<application>
  <component name="github-copilot">
    <option name="mcpConfigPath" value="/home/$USER/.config/github-copilot/intellij/mcp.json" />
    <option name="signinNotificationShown" value="true" />
    <option name="terminalRulesVersion" value="1" />
    <mcpSamplingAllowedModels>
      <option value="claude-sonnet-4.5" />
      <option value="gpt-4.1" />
      <option value="gpt-5.4" />
      <option value="gpt-5.4-mini" />
    </mcpSamplingAllowedModels>
  </component>
</application>
EOF

# Test it
~/.local/bin/mcp-agency-agents <<< '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

## 🔍 Quick Diagnostics

```bash
# Check all configs exist
ls -lh ~/.local/bin/mcp-agency-agents ~/.local/bin/mcp-http-bridge
cat ~/.config/JetBrains/Rider2025.3/options/github-copilot.xml | grep mcpConfigPath
cat ~/.config/github-copilot/intellij/mcp.json

# Test wrapper
~/.local/bin/mcp-agency-agents <<< '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | grep list_agents
```

## ✅ Success Checklist

- [ ] Rider is CLOSED before editing configs
- [ ] Bridge script downloaded to `~/.local/bin/mcp-http-bridge`
- [ ] Wrapper script created at `~/.local/bin/mcp-agency-agents`
- [ ] MCP config created at `~/.config/github-copilot/intellij/mcp.json`
- [ ] **CRITICAL:** `github-copilot.xml` has `mcpConfigPath` option
- [ ] All paths are absolute (no `~` or `$HOME`)
- [ ] Wrapper test returns JSON with tools
- [ ] Rider restarted AFTER config changes
- [ ] NEW Copilot conversation started (+ button)

## 🔧 Quick Fix Script

If your config keeps getting overwritten by Rider, use this script:

```bash
# Close Rider first, then run:
./fix-copilot-config.sh

# Or from anywhere:
~/github/agency-agents-mcp/fix-copilot-config.sh
```

This script will:
- ✅ Check that Rider is closed
- 📦 Backup your existing config
- ✏️  Add the critical `mcpConfigPath` line
- ✅ Verify the change worked

## 🚨 Common Mistakes

| Mistake | Symptom | Fix |
|---------|---------|-----|
| Edited `github-copilot.xml` with Rider open | Config reverts on restart | Close Rider, run `./fix-copilot-config.sh` |
| Missing `mcpConfigPath` line | No tools in Copilot | Run `./fix-copilot-config.sh` |
| Using relative paths | Can't find scripts | Use `/home/username/...` |
| Old Copilot conversation | Tools not appearing | Click + for new chat |
| Wrong file locations | Silent failure | Check paths match exactly |

## 📁 File Locations

```
~/.local/bin/
  ├── mcp-http-bridge          ← 2KB, executable
  └── mcp-agency-agents         ← 122 bytes, executable

~/.config/github-copilot/intellij/
  └── mcp.json                  ← Server definition

~/.config/JetBrains/Rider2025.3/options/
  └── github-copilot.xml        ← MUST have mcpConfigPath!
```

## 🧪 Test Commands

```bash
# Test 1: Wrapper script works
~/.local/bin/mcp-agency-agents <<< '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
# ✅ Should return JSON with list_agents, activate_agent, etc.

# Test 2: Can list agents
~/.local/bin/mcp-agency-agents <<< '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"list_agents","arguments":{}}}'
# ✅ Should return array of 144+ agents

# Test 3: Remote server is up
curl https://agency-agents-mcp.regtransfers.dev/health
# ✅ Should return: {"status":"ok","timestamp":"...","mcpReady":true,"initializeComplete":true}
```

## 🎯 Expected Behavior

**In Rider GitHub Copilot Chat:**

```
You: list available agents

Copilot: Here are the available agent personas:

Engineering:
- engineering-ai-engineer: AI/ML systems specialist...
- engineering-backend-architect: Backend architecture expert...
[... 144+ agents total ...]
```

## 🔧 Troubleshooting One-Liners

```bash
# Full diagnostic report
echo "=== Wrapper ===" && cat ~/.local/bin/mcp-agency-agents && \
echo -e "\n=== GitHub Copilot Config ===" && cat ~/.config/JetBrains/Rider2025.3/options/github-copilot.xml && \
echo -e "\n=== MCP Servers ===" && cat ~/.config/github-copilot/intellij/mcp.json && \
echo -e "\n=== Test ===" && ~/.local/bin/mcp-agency-agents <<< '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | head -20

# Check Rider logs
tail -100 ~/.cache/JetBrains/Rider2025.3/log/idea.log | grep -i mcp

# Verify mcpConfigPath is set
grep -A 2 mcpConfigPath ~/.config/JetBrains/Rider2025.3/options/github-copilot.xml
```

## 💡 Pro Tips

1. **Always start fresh conversations** after config changes - old chats keep stale tools
2. **Close Rider before editing** `github-copilot.xml` - it's auto-generated!
3. **Use absolute paths** everywhere - IDEs don't inherit shell PATH
4. **Test wrapper first** - if it fails, Rider can't work either
5. **Check logs** - `~/.cache/JetBrains/Rider2025.3/log/idea.log` has MCP startup info

## 📚 Full Documentation

- **Complete Guide:** `RIDER-2025.3-COMPLETE-SETUP.md`
- **Troubleshooting:** See `README.md` Troubleshooting section
- **Update Notes:** `README-UPDATE-SUMMARY.md`

## 🆘 Still Not Working?

1. Run diagnostic report (above)
2. Check `tail -100 ~/.cache/JetBrains/Rider2025.3/log/idea.log | grep -i mcp`
3. Verify remote server: `curl https://agency-agents-mcp.regtransfers.dev/health`
4. Open issue with diagnostic output

---

**Last Updated:** April 16, 2026  
**Tested With:** Rider 2025.3, GitHub Copilot plugin (latest)  
**Platform:** Linux (should work on macOS with same paths)

