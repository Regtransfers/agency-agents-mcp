# What to Search For: MCP Configuration in Rider/JetBrains IDEs

## 🔍 The Problem
- **McpExtensionService loads** ✅
- **Config file `mcp.json` exists** ✅  
- **`mcpConfigPath` is set in `github-copilot.xml`** ✅
- **BUT: No MCP servers are spawned** ❌

The logs show:
```
INFO - McpExtensionService - MCP Extension Service started successfully
```
But there's NO log of it reading `/home/aaron/.config/github-copilot/intellij/mcp.json` or spawning `mcp-agency-agents`.

## 🎯 Exact Search Queries to Try

### GitHub Issues Search
1. **GitHub Copilot JetBrains MCP**
   - `site:github.com/github/copilot-docs MCP JetBrains`
   - `site:github.com/jetbrains MCP configuration github copilot`
   - `site:youtrack.jetbrains.com MCP github copilot`

2. **MCP Config Path Issues**
   - `"mcpConfigPath" jetbrains rider`
   - `"mcp.json" intellij not loading`
   - `McpExtensionService configuration path`

3. **GitHub Copilot MCP Setup**
   - `github copilot mcp setup jetbrains`
   - `"github-copilot.xml" mcp configuration`
   - `mcp servers not loading intellij`

### Official Documentation
1. **JetBrains Docs**
   - `site:jetbrains.com/help MCP model context protocol`
   - `site:jetbrains.com/help github copilot extensions`
   - `site:plugins.jetbrains.com github copilot mcp`

2. **GitHub Copilot Docs**
   - `site:docs.github.com/copilot MCP jetbrains`
   - `site:docs.github.com/copilot model context protocol IDE`
   - `github copilot mcp supported IDEs`

### Community Forums
1. **JetBrains Community**
   - `site:intellij-support.jetbrains.com MCP`
   - `site:intellij-support.jetbrains.com github copilot mcp`
   - `site:reddit.com/r/jetbrains MCP github copilot`

2. **Stack Overflow**
   - `site:stackoverflow.com [jetbrains-ide] [github-copilot] MCP`
   - `site:stackoverflow.com rider github copilot mcp not working`

## 🔑 Key Questions to Answer

1. **Is `mcpConfigPath` the correct option name?**
   - Maybe it's called something else
   - Maybe it's in a different XML file
   - Maybe it needs to be in a different format

2. **Where should `mcp.json` actually be located?**
   - Current location: `~/.config/github-copilot/intellij/mcp.json`
   - Alternative locations to check:
     - `~/.config/JetBrains/Rider2025.3/github-copilot/mcp.json`
     - `~/.config/JetBrains/Rider2025.3/options/mcp-servers.xml`
     - Project-level: `.idea/mcp.json`
     - Home directory: `~/.mcp/config.json`

3. **Is MCP actually supported in Rider 2025.3?**
   - The plugin is installed: `MCP Server (253.31033.136)`
   - But is it only for VS Code?
   - Does it require a specific GitHub Copilot plugin version?

4. **What's the correct configuration format?**
   - Is stdio transport supported?
   - Does it need special environment variables?
   - Are there registry keys or feature flags required?

## 📋 What We Know Works

### ✅ The MCP Server Itself
```bash
~/.local/bin/mcp-agency-agents <<< '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
# Returns: {"result":{"tools":[{"name":"list_agents"...
```

### ✅ The Wrapper Script
```bash
#!/bin/bash
export MCP_URL="https://agency-agents-mcp.regtransfers.dev"
exec ~/.local/bin/mcp-http-bridge "$@"
```

### ✅ The Config Files Exist
```bash
$ cat ~/.config/github-copilot/intellij/mcp.json
{
    "servers": {
        "agency-agents": {
            "type": "stdio",
            "command": "/home/aaron/.local/bin/mcp-agency-agents"
        }
    }
}

$ cat ~/.config/JetBrains/Rider2025.3/options/github-copilot.xml | grep mcpConfigPath
<option name="mcpConfigPath" value="/home/aaron/.config/github-copilot/intellij/mcp.json" />
```

### ✅ The Logs Show MCP Extension Loading
```
INFO - McpExtensionService - OS Linux detected - will enable MCP Extension Service
INFO - McpExtensionService - Enabling McpExtensionService
INFO - McpExtensionService - McpExtensionService enabled successfully
INFO - McpExtensionService - MCP Extension Service started successfully
```

## ❌ What's Missing

**NO log entries showing:**
- Reading `/home/aaron/.config/github-copilot/intellij/mcp.json`
- Spawning `/home/aaron/.local/bin/mcp-agency-agents`
- Initializing MCP server connections
- Any errors about configuration or paths

## 🎯 Alternative Configuration Methods to Research

1. **Environment Variables**
   - `MCP_CONFIG_PATH`
   - `GITHUB_COPILOT_MCP_CONFIG`
   - Check if there's a way to set this via IDE environment

2. **Registry Settings**
   - Check if there's a registry key: `llm.mcp.client.enabled`
   - Look for feature flags related to MCP in logs

3. **IDE Settings UI**
   - Is there a GUI setting in Rider for MCP?
   - GitHub Copilot settings panel
   - Experimental features panel

4. **Alternative Config Locations**
   - VSCode uses: `~/.vscode/mcp-config.json`
   - Maybe Rider uses: `~/.rider/mcp-config.json`?
   - Or: Project-specific `.mcp/config.json`?

## 🚀 Next Steps

1. **Search with the queries above**
2. **Check official GitHub Copilot MCP documentation**
3. **Look for JetBrains-specific MCP setup guides**
4. **Find the GitHub Copilot for JetBrains plugin repository**
5. **Check if there's a specific Rider MCP plugin needed**

## 📝 Information to Collect

When you find docs, note:
- [ ] Exact config file location
- [ ] Exact XML/JSON structure required
- [ ] Supported transport types (stdio vs SSE vs HTTP)
- [ ] Required environment variables
- [ ] Supported Rider versions
- [ ] GitHub Copilot plugin version requirements
- [ ] Any registry settings needed
- [ ] Any IDE restart requirements beyond normal restart

## 🐛 Possible Bugs/Limitations

This might be:
1. **Not implemented yet** - MCP for JetBrains is experimental
2. **VS Code only** - MCP might only work in VS Code currently
3. **Requires newer version** - Might need Rider 2025.4 or later
4. **Requires specific plugin** - Might need a separate MCP plugin
5. **Configuration bug** - The `mcpConfigPath` option exists but is ignored

---

**Status as of:** April 17, 2026  
**Rider Version:** 2025.3 (build 253.31033.136)  
**GitHub Copilot Plugin:** Installed and working (inline completion works)  
**MCP Server Plugin:** Installed (253.31033.136)
**McpExtensionService:** Loads but doesn't spawn servers

