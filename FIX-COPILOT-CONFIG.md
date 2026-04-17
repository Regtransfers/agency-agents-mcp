# Fix GitHub Copilot MCP Config

## The Problem

Rider keeps overwriting the `github-copilot.xml` config file, removing the critical `mcpConfigPath` line that tells GitHub Copilot where to find the MCP server configuration.

**Symptoms:**
- MCP bridge works from terminal (`~/.local/bin/mcp-agency-agents` runs fine)
- MCP config file exists at `~/.config/github-copilot/intellij/mcp.json`
- But GitHub Copilot in Rider doesn't see the 144+ agent personas
- Only shows 1 built-in "Plan" agent

**Root Cause:**
The `~/.config/JetBrains/Rider2025.3/options/github-copilot.xml` file is missing this line:
```xml
<option name="mcpConfigPath" value="/home/aaron/.config/github-copilot/intellij/mcp.json" />
```

## The Solution

### Quick Fix (Recommended)

Close Rider, then run:

```bash
cd ~/github/agency-agents-mcp
./fix-copilot-config.sh
```

The script will:
1. ✅ Check that Rider is closed
2. 📦 Backup your existing config
3. ✏️  Add the `mcpConfigPath` line
4. ✅ Verify the change worked
5. Show you the updated config

Then:
1. Start Rider
2. Open a **NEW** Copilot conversation (click + button)
3. Ask: "list available agents"
4. You should see 144+ agents! 🎉

### Manual Fix

If you prefer to do it manually:

```bash
# 1. Close Rider completely
# 2. Edit the config file
nano ~/.config/JetBrains/Rider2025.3/options/github-copilot.xml

# 3. Make sure it looks like this:
```

```xml
<application>
  <component name="github-copilot">
    <option name="mcpConfigPath" value="/home/aaron/.config/github-copilot/intellij/mcp.json" />
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
```

The critical line is line 3: `<option name="mcpConfigPath" value="..." />`

## Verification

After running the script and restarting Rider:

```bash
# Check the config has the line:
grep mcpConfigPath ~/.config/JetBrains/Rider2025.3/options/github-copilot.xml

# Should output:
#   <option name="mcpConfigPath" value="/home/aaron/.config/github-copilot/intellij/mcp.json" />
```

In Rider GitHub Copilot Chat (new conversation):

```
You: list available agents

Expected: Should list 144+ agent personas from categories like:
- engineering-*
- design-*
- marketing-*
- testing-*
- sales-*
- product-*
- etc.
```

## Why This Happens

JetBrains IDEs auto-generate the `github-copilot.xml` file when the GitHub Copilot plugin starts/stops. If you edit it while Rider is running, your changes get overwritten when you close Rider.

The MCP integration is relatively new, so the auto-generated file doesn't include the `mcpConfigPath` option by default. You need to add it manually while Rider is closed.

## Troubleshooting

### Script says "Rider is running"
Close Rider completely (File → Exit) and try again.

### Config gets overwritten again after restart
This can happen if:
1. You edited it while Rider was open
2. The GitHub Copilot plugin regenerated it

Solution: Run `./fix-copilot-config.sh` again (with Rider closed)

### Still not seeing agents in Copilot
1. Check the config has `mcpConfigPath`: `grep mcpConfigPath ~/.config/JetBrains/Rider2025.3/options/github-copilot.xml`
2. Start a **NEW** conversation (click + button) - old chats cache the available tools
3. Check Rider logs: `tail -100 ~/.cache/JetBrains/Rider2025.3/log/idea.log | grep -i mcp`
4. Verify remote server is up: `curl https://agency-agents-mcp.regtransfers.dev/healthz`

### MCP bridge doesn't work
Test it directly:
```bash
~/.local/bin/mcp-agency-agents <<< '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

Should return JSON with `list_agents`, `activate_agent`, etc.

If this fails, re-run the setup from `RIDER-QUICK-REF.md`

## Files Involved

```
~/.local/bin/
  ├── mcp-http-bridge        ← Bridge to remote MCP server
  └── mcp-agency-agents      ← Wrapper script with MCP_URL

~/.config/github-copilot/intellij/
  └── mcp.json              ← MCP server definition (points to wrapper)

~/.config/JetBrains/Rider2025.3/options/
  └── github-copilot.xml    ← MUST have mcpConfigPath pointing to mcp.json
```

The chain:
1. `github-copilot.xml` tells Copilot plugin: "read MCP servers from `mcp.json`"
2. `mcp.json` tells Copilot: "run `/home/aaron/.local/bin/mcp-agency-agents`"
3. `mcp-agency-agents` wrapper sets `MCP_URL` and runs `mcp-http-bridge`
4. `mcp-http-bridge` connects to `https://agency-agents-mcp.regtransfers.dev`
5. Remote server provides 144+ agent personas via MCP protocol

If ANY link in this chain is broken, the agents won't appear in Copilot.

## Related Documentation

- **Quick Reference:** `RIDER-QUICK-REF.md`
- **Complete Setup:** `RIDER-2025.3-COMPLETE-SETUP.md`
- **README:** Main project README with full details

---

**Created:** April 16, 2026  
**Purpose:** Fix the persistent config overwrite issue with Rider + GitHub Copilot MCP integration

