# Agency Agents MCP - Quick Setup

## Connect Your IDE in 2 Minutes (No Project Clone Required!)

### For Users (Connecting to Hosted Server)

**Step 1: Download the bridge (one command)**
```bash
# Linux/macOS
curl -o ~/.local/bin/mcp-http-bridge https://raw.githubusercontent.com/Regtransfers/agency-agents-mcp/main/mcp-http-bridge.mjs && chmod +x ~/.local/bin/mcp-http-bridge
```

**Step 2: Configure Rider**
```bash
mkdir -p ~/.config/github-copilot/intellij && cat > ~/.config/github-copilot/intellij/mcp.json << 'EOF'
{
    "servers": {
        "agency-agents": {
            "type": "stdio",
            "command": "/home/$USER/.local/bin/mcp-http-bridge",
            "env": {
                "MCP_URL": "https://agency-agents-mcp.regtransfers.dev"
            }
        }
    }
}
EOF
```

**For VS Code:** Change `intellij` to `vscode` in the path above

**Step 3: Restart IDE**

Done! Test it:
- Open Copilot Chat
- Type: `List available agents`

---

### For Developers (Working on MCP Server)

If you're developing the MCP server itself:

**Step 1: Clone**
```bash
git clone https://github.com/Regtransfers/agency-agents-mcp.git
cd agency-agents-mcp
npm install
```

**Step 2: Configure for local server**
```bash
NODE_BIN="$(which node)"
PROJECT_PATH="$(pwd)"
mkdir -p ~/.config/github-copilot/intellij && cat > ~/.config/github-copilot/intellij/mcp.json << EOF
{
    "servers": {
        "agency-agents": {
            "type": "stdio",
            "command": "$NODE_BIN",
            "args": ["$PROJECT_PATH/server.mjs"]
        }
    }
}
EOF
```

**Step 3: Restart IDE**

---

## What You Get

- **144 Agent Personas** - Backend architects, security engineers, DevOps specialists, etc.
- **1,412 Skills** - TDD, API design, Kubernetes deployment, security testing, etc.

## Usage Examples

```
List available agents
Activate the backend architect agent
Use the test-driven-development skill
Search for skills about kubernetes
```

## Differences

| Setup | Best For | Pros | Cons |
|-------|----------|------|------|
| **Hosted** | Regular users | No setup, auto-updates | 2-6s latency |
| **Local** | Developers | Instant, offline | Must restart IDE for updates |

---

**Full docs:** [README.md](README.md)  
**Troubleshooting:** See README troubleshooting section

