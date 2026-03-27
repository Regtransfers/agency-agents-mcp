# Agency Agents MCP Server

An MCP (Model Context Protocol) server that gives GitHub Copilot access to 160+ specialist AI agent personas. Once installed, you can ask Copilot to "be a backend architect" or "activate the security engineer" and it will adopt that specialist's full personality, expertise, and methodology for the rest of the conversation.

Works with **JetBrains Rider**, **IntelliJ**, and **VS Code** on **Linux**, **macOS**, and **Windows**.

---

## What You Get

Three tools are exposed to Copilot's agent mode:

| Tool | What it does |
|---|---|
| `list_agents` | List all installed personas, optionally filtered by category |
| `activate_agent` | Load a persona so the AI adopts that specialist role |
| `search_agents` | Full-text search across agent names, descriptions, and content |

Agent categories include: `engineering`, `design`, `marketing`, `testing`, `sales`, `product`, `academic`, `support`, `game-development`, `specialized`, `project-management`, `paid-media`, `spatial-computing`, and more.

---

## Prerequisites

- **Node.js >= 18** (check with `node -v`)
- **npm** (ships with Node)
- **git**
- **GitHub Copilot** plugin installed in your IDE with an active subscription

---

## Quick Install

### Linux / macOS

```bash
git clone https://github.com/Regtransfers/agency-agents-mcp.git
cd agency-agents-mcp
chmod +x install.sh
./install.sh
```

### Windows (PowerShell)

```powershell
git clone https://github.com/Regtransfers/agency-agents-mcp.git
cd agency-agents-mcp
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\install.ps1
```

The script will:

1. Check that Node >= 18, npm, and git are available.
2. Clone the [agency-agents](https://github.com/msitarzewski/agency-agents) persona definitions into `~/.github/agents/`.
3. Copy the MCP server into `~/.github/mcp-servers/agency-agents/` and run `npm install`.
4. Ask which IDE you use and write the Copilot MCP config (`mcp.json`) for that IDE.
5. Tell you to restart the IDE.

After the script finishes, **restart your IDE** and open Copilot Chat.

---

## Manual Install

If you prefer to do it step by step:

### 1. Download agent definitions

```bash
mkdir -p ~/.github/agents
git clone --depth 1 https://github.com/msitarzewski/agency-agents.git /tmp/agency-agents
cp /tmp/agency-agents/agents/*.md ~/.github/agents/
rm -rf /tmp/agency-agents
```

### 2. Install the MCP server

```bash
mkdir -p ~/.github/mcp-servers/agency-agents
cp server.mjs package.json ~/.github/mcp-servers/agency-agents/
cd ~/.github/mcp-servers/agency-agents
npm install --production
```

### 3. Verify it starts

```bash
node ~/.github/mcp-servers/agency-agents/server.mjs
# Should hang (waiting for stdin). Ctrl+C to stop.
```

### 4. Register with your IDE

The config file must use **fully resolved absolute paths** — it does not expand `~`, `$HOME`, or `%USERPROFILE%`.

Run the appropriate one-liner below to generate the file with the correct paths for your machine:

**JetBrains Rider / IntelliJ (Linux / macOS):**

```bash
mkdir -p ~/.config/github-copilot/intellij && cat > ~/.config/github-copilot/intellij/mcp.json << EOF
{
    "servers": {
        "agency-agents": {
            "type": "stdio",
            "command": "node",
            "args": ["$HOME/.github/mcp-servers/agency-agents/server.mjs"],
            "env": {
                "AGENTS_DIR": "$HOME/.github/agents"
            }
        }
    }
}
EOF
```

**VS Code (Linux / macOS):**

```bash
mkdir -p ~/.config/github-copilot/vscode && cat > ~/.config/github-copilot/vscode/mcp.json << EOF
{
    "servers": {
        "agency-agents": {
            "type": "stdio",
            "command": "node",
            "args": ["$HOME/.github/mcp-servers/agency-agents/server.mjs"],
            "env": {
                "AGENTS_DIR": "$HOME/.github/agents"
            }
        }
    }
}
EOF
```

**Windows (PowerShell):**

```powershell
$dir = "$env:APPDATA\github-copilot\intellij"   # change 'intellij' to 'vscode' for VS Code
New-Item -ItemType Directory -Force -Path $dir | Out-Null
@"
{
    "servers": {
        "agency-agents": {
            "type": "stdio",
            "command": "node",
            "args": ["$($env:USERPROFILE -replace '\\','/')/.github/mcp-servers/agency-agents/server.mjs"],
            "env": {
                "AGENTS_DIR": "$($env:USERPROFILE -replace '\\','/')/.github/agents"
            }
        }
    }
}
"@ | Set-Content "$dir\mcp.json"
```

After running, verify the file contains your real home directory (e.g. `/home/daniel/...`), not a placeholder.

### 5. Restart the IDE

Close and reopen your IDE. The Copilot plugin reads `mcp.json` at startup and launches the server automatically.

---

## Usage

Open Copilot Chat in **agent mode** and try:

```
List available agents
```

```
Activate the backend architect agent and review my API design
```

```
Search for agents about security
```

```
List engineering agents
```

When you activate an agent, the AI adopts that persona for the rest of the conversation. Start a new chat to reset.

---

## Adding Custom Agents

Drop a Markdown file into `~/.github/agents/`. The format is:

```markdown
---
name: My Custom Agent
description: One-line summary of what this agent does
---

# My Custom Agent

You are **My Custom Agent**. You specialise in...

(full instructions and personality here)
```

Only `name` and `description` from the frontmatter are used by the server. Everything below the frontmatter is the persona body that gets sent to the AI.

Restart the IDE after adding new agents.

---

## Updating Agents

To pull the latest personas from the upstream repo:

```bash
git clone --depth 1 https://github.com/msitarzewski/agency-agents.git /tmp/agency-agents
cp /tmp/agency-agents/agents/*.md ~/.github/agents/
rm -rf /tmp/agency-agents
```

Then restart the IDE.

---

## Uninstall

### Linux / macOS

```bash
chmod +x uninstall.sh
./uninstall.sh
```

### Windows (PowerShell)

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\uninstall.ps1
```

Or manually:

**Linux / macOS:**

```bash
rm -rf ~/.github/agents
rm -rf ~/.github/mcp-servers/agency-agents
# Then remove the "agency-agents" block from your mcp.json
```

**Windows (PowerShell):**

```powershell
Remove-Item "$env:USERPROFILE\.github\agents" -Recurse -Force
Remove-Item "$env:USERPROFILE\.github\mcp-servers\agency-agents" -Recurse -Force
# Then remove the "agency-agents" block from your mcp.json
```

Restart the IDE after uninstalling.

---

## Directory Layout After Install

**Linux / macOS:**

```
~/.github/
├── agents/                                   # Agent persona .md files
│   ├── engineering-backend-architect.md
│   ├── engineering-code-reviewer.md
│   ├── engineering-security-engineer.md
│   ├── design-ux-architect.md
│   └── ... (160+ files)
└── mcp-servers/
    └── agency-agents/
        ├── server.mjs                        # MCP server
        ├── package.json
        ├── package-lock.json
        └── node_modules/

~/.config/github-copilot/
├── intellij/
│   └── mcp.json                              # Rider/IntelliJ config
└── vscode/
    └── mcp.json                              # VS Code config
```

**Windows:**

```
%USERPROFILE%\.github\
├── agents\                                   # Agent persona .md files
│   └── ... (160+ files)
└── mcp-servers\
    └── agency-agents\
        ├── server.mjs
        ├── package.json
        ├── package-lock.json
        └── node_modules\

%APPDATA%\github-copilot\
├── intellij\
│   └── mcp.json                              # Rider/IntelliJ config
└── vscode\
    └── mcp.json                              # VS Code config
```

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| Copilot doesn't show the agent tools | Restart the IDE. Verify `mcp.json` uses absolute paths. |
| Server crashes on startup | Run `node ~/.github/mcp-servers/agency-agents/server.mjs` manually to see the error. Usually a missing `npm install`. |
| "No agents installed" response | Check `~/.github/agents/` has `.md` files. Check `AGENTS_DIR` in `mcp.json`. |
| `node: command not found` | Ensure Node >= 18 is installed and on your `PATH`. |
| Works in VS Code but not Rider (or vice versa) | Each IDE has its own `mcp.json` path. Make sure you created the config in the right directory. |
| Already have other MCP servers in `mcp.json` | Merge the `agency-agents` block into your existing `servers` object rather than replacing the file. |

---

## How It Works

1. The Copilot plugin reads `mcp.json` at startup and spawns `node server.mjs` as a child process.
2. The server communicates with Copilot over **stdin/stdout** using the Model Context Protocol.
3. When you ask Copilot to list or activate an agent, it calls the MCP tool.
4. The server reads the matching `.md` file from `~/.github/agents/` and returns the persona text.
5. Copilot adopts those instructions for the remainder of the conversation.

The server is stateless. It reads all agent files once at startup and serves them from memory. No network calls, no external dependencies at runtime.

---

## Credits

Agent personas sourced from [msitarzewski/agency-agents](https://github.com/msitarzewski/agency-agents).

MCP server built on the [@modelcontextprotocol/sdk](https://www.npmjs.com/package/@modelcontextprotocol/sdk).

---

## Licence

MIT



