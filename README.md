# Agency Agents MCP Server
An MCP (Model Context Protocol) server that gives GitHub Copilot access to **160+ specialist AI agent personas** and **1,400+ specialized skills**. Once installed, you can ask Copilot to "be a backend architect" or "activate the security engineer" (agents), or "use brainstorming" or "activate TDD" (skills) and it will adopt that specialist's full personality, expertise, and methodology for the rest of the conversation.
Works with **JetBrains Rider**, **IntelliJ**, and **VS Code** on **Linux**, **macOS**, and **Windows**.
Deployable as a **Docker container** with Azure DevOps pipeline support.

> **⚡ Quick Start for Developers:** See the [**Quick Reference Guide**](QUICK-REFERENCE.md) for the top 10 most useful skills, ready-to-use commands, and real-world workflows.

---
## What You Get
Ten tools are exposed to Copilot's agent mode:

### Agent Tools
| Tool | What it does |
|---|---|
| `list_agents` | List all installed personas, optionally filtered by category |
| `activate_agent` | Load a persona so the AI adopts that specialist role |
| `search_agents` | Full-text search across agent names, descriptions, and content |
| `get_shared_instructions` | View the shared instructions (e.g. clean code standards) applied to every agent |

Agent categories include: `engineering`, `design`, `marketing`, `testing`, `sales`, `product`, `academic`, `support`, `game-development`, `specialized`, `project-management`, `paid-media`, `spatial-computing`, and more.

### Skill Tools
| Tool | What it does |
|---|---|
| `list_skills` | List all available skills, optionally filtered by category |
| `activate_skill` | Load a skill so the AI follows those specialized instructions |
| `search_skills` | Full-text search across skill names, descriptions, and content |
| `get_skill_categories` | View all skill categories with counts |

Skill categories include: `ai-ml`, `backend`, `frontend`, `security`, `testing`, `automation`, `design`, `marketing`, `data`, `workflow`, `devops`, and many more.

### System Tools
| Tool | What it does |
|---|---|
| `healthz` | RPC-based health check endpoint for Kubernetes probes (see [HEALTHZ-RPC.md](HEALTHZ-RPC.md)) |
---
## Prerequisites
### Local Development
- **Node.js >= 18** (check with `node -v`)
- **npm** (ships with Node)
- **git**
- **GitHub Copilot** plugin installed in your IDE with an active subscription
### Docker Deployment
- **Docker** (check with `docker -v`)
- **Docker Compose** (optional, for local development)
---
## Docker Deployment (Recommended for Production)
### Quick Start with Docker
\`\`\`bash
git clone https://github.com/Regtransfers/agency-agents-mcp.git
cd agency-agents-mcp
docker build -t agency-agents-mcp:latest .
docker run -it agency-agents-mcp:latest
\`\`\`
### Using Docker Compose
\`\`\`bash
git clone https://github.com/Regtransfers/agency-agents-mcp.git
cd agency-agents-mcp
docker-compose up --build
\`\`\`
### Azure Container Registry Deployment
The project includes Azure DevOps pipelines that automatically build and push Docker images to Azure Container Registry on every commit to \`main\`:
- **Pipeline**: \`azure-pipelines.yml\`
- **Container Registry**: \`bluemountain.azurecr.io\`
- **Image Name**: \`agency-agents-mcp\`
The pipeline is configured to run on the \`BlueMountain-PROD\` agent pool.
---
## Quick Setup (Connect to Hosted Server)

**No installation required!** Connect your IDE directly to the hosted MCP server.

### One-Time Setup

**1. Download the bridge script:**
\`\`\`bash
# Linux/macOS - save to ~/.local/bin
mkdir -p ~/.local/bin
curl -o ~/.local/bin/mcp-http-bridge https://raw.githubusercontent.com/Regtransfers/agency-agents-mcp/main/mcp-http-bridge.mjs
chmod +x ~/.local/bin/mcp-http-bridge
\`\`\`

**2. Configure your IDE:**

**Rider/IntelliJ (Linux/macOS):**
\`\`\`bash
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
\`\`\`

**VS Code (Linux/macOS):**
\`\`\`bash
mkdir -p ~/.config/github-copilot/vscode && cat > ~/.config/github-copilot/vscode/mcp.json << 'EOF'
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
\`\`\`

**Windows (PowerShell):**
\`\`\`powershell
# Download bridge
$bridgeDir = "$env:LOCALAPPDATA\mcp-bridge"
New-Item -ItemType Directory -Force -Path $bridgeDir | Out-Null
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/Regtransfers/agency-agents-mcp/main/mcp-http-bridge.mjs" -OutFile "$bridgeDir\mcp-http-bridge.mjs"

# Configure Rider
$configDir = "$env:APPDATA\github-copilot\intellij"  # or 'vscode' for VS Code
New-Item -ItemType Directory -Force -Path $configDir | Out-Null
@"
{
    "servers": {
        "agency-agents": {
            "type": "stdio",
            "command": "node",
            "args": ["$bridgeDir\\mcp-http-bridge.mjs"],
            "env": {
                "MCP_URL": "https://agency-agents-mcp.regtransfers.dev"
            }
        }
    }
}
"@ | Set-Content "$configDir\mcp.json"
\`\`\`

**3. Restart your IDE**

That's it! You now have access to 144 agents and 1,412 skills.

**Test it:**
- Open Copilot Chat
- Type: `List available agents`
- Should see 144 agent personas

---
## Local Development (Advanced)
### 1. Clone the repository
\`\`\`bash
git clone https://github.com/Regtransfers/agency-agents-mcp.git
cd agency-agents-mcp
\`\`\`
The repository includes:
- 160+ agent personas in `./agents/`
- 1,400+ specialized skills in `./skills/`
- Shared instructions (clean code standards) in `./shared-instructions/`
- The MCP server (`server.mjs`) configured to use local folders
### 2. Install dependencies
\`\`\`bash
npm install --production
\`\`\`
### 3. Verify it starts
\`\`\`bash
node server.mjs
# Should hang (waiting for stdin). Ctrl+C to stop.
\`\`\`
### 4. Register with your IDE
The config file must use **fully resolved absolute paths** — it does not expand \`~\`, \`$HOME\`, or \`%USERPROFILE%\`.
> **Important:** Use the absolute path to \`node\`, not just \`node\`. IDEs do not inherit your shell's PATH, so a bare \`node\` command will silently fail — especially if node was installed via nvm, fnm, Homebrew, etc.
>
> Find yours with: \`which node\` (Linux/macOS) or \`(Get-Command node).Source\` (PowerShell).
Run these commands from the project directory. They will automatically detect your node path and project path.
**JetBrains Rider / IntelliJ (Linux / macOS):**
\`\`\`bash
NODE_BIN="\$(readlink -f "\$(which node)" 2>/dev/null || which node)" && \\
PROJECT_PATH="\$(pwd)" && \\
mkdir -p ~/.config/github-copilot/intellij && cat > ~/.config/github-copilot/intellij/mcp.json << EOF
{
    "servers": {
        "agency-agents": {
            "type": "stdio",
            "command": "\$NODE_BIN",
            "args": ["\$PROJECT_PATH/server.mjs"]
        }
    }
}
EOF
\`\`\`
**VS Code (Linux / macOS):**
\`\`\`bash
NODE_BIN="\$(readlink -f "\$(which node)" 2>/dev/null || which node)" && \\
PROJECT_PATH="\$(pwd)" && \\
mkdir -p ~/.config/github-copilot/vscode && cat > ~/.config/github-copilot/vscode/mcp.json << EOF
{
    "servers": {
        "agency-agents": {
            "type": "stdio",
            "command": "\$NODE_BIN",
            "args": ["\$PROJECT_PATH/server.mjs"]
        }
    }
}
EOF
\`\`\`
**Windows (PowerShell):**
\`\`\`powershell
$nodeBin = ((Get-Command node).Source -replace '\\\\','/')
$projectPath = (Get-Location).Path -replace '\\\\','/'
$dir = "$env:APPDATA\\github-copilot\\intellij"   # change 'intellij' to 'vscode' for VS Code
New-Item -ItemType Directory -Force -Path $dir | Out-Null
@"
{
    "servers": {
        "agency-agents": {
            "type": "stdio",
            "command": "$nodeBin",
            "args": ["$projectPath/server.mjs"]
        }
    }
}
"@ | Set-Content "$dir\\mcp.json"
```
The server automatically uses the `./agents/`, `./skills/`, and `./shared-instructions/` folders from the project directory. You can override with environment variables `AGENTS_DIR`, `SKILLS_DIR`, and `SHARED_INSTRUCTIONS_DIR` if needed.
### 5. Restart the IDE
Close and reopen your IDE. The Copilot plugin reads \`mcp.json\` at startup and launches the server automatically.
---
## Usage
Open Copilot Chat in **agent mode** and try:

### Working with Agents
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

### Working with Skills
```
List available skills
```
```
Activate the brainstorming skill
```
```
Search for skills about testing
```
```
Show me all skill categories
```
```
List skills in the ai-ml category
```

When you activate an agent or skill, the AI adopts those instructions for the rest of the conversation. Start a new chat to reset.

> **📘 New to Skills?** See the [**Skills Guide**](SKILLS-GUIDE.md) for a comprehensive introduction to the 1,400+ available skills, including categories, best practices, and usage examples.
> 
> **⚡ Development Teams?** Check out the [**Quick Reference**](QUICK-REFERENCE.md) for the top 10 skills and real-world workflow examples tailored for feature development, testing, and infrastructure deployment.

---
## For Development Teams: Top 10 Essential Skills

These skills are specifically selected for teams building features, writing tests, and deploying infrastructure:

### 🎯 **Feature Development**
1. **`brainstorming`** - Design features before coding
   ```
   Use the brainstorming skill to help me design a user authentication system
   ```

2. **`test-driven-development`** - Write tests first (TDD workflow)
   ```
   Activate TDD skill and help me add payment processing with Stripe
   ```

3. **`code-review-excellence`** - Conduct thorough code reviews
   ```
   Activate code-review-excellence and review this PR for the new API endpoints
   ```

### 🔧 **API Development**
4. **`api-design-principles`** - REST and GraphQL API design
   ```
   Use api-design-principles skill to design a REST API for our inventory system
   ```

5. **`api-security-testing`** - API vulnerability testing
   ```
   Activate api-security-testing and audit our authentication endpoints
   ```

### 🧪 **Testing & Quality**
6. **`e2e-testing`** - End-to-end test workflows
   ```
   Use e2e-testing skill to create Playwright tests for our checkout flow
   ```

7. **`systematic-debugging`** - Debug methodically, not randomly
   ```
   Activate systematic-debugging and help me fix this race condition in our queue processor
   ```

### 🚀 **Infrastructure & Deployment**
8. **`kubernetes-deployment`** - K8s best practices and Flux CD
   ```
   Use kubernetes-deployment skill to create a deployment manifest for our new microservice
   ```

9. **`gitops-workflow`** - GitOps and Flux patterns
   ```
   Activate gitops-workflow and help me set up Flux CD for our staging environment
   ```

10. **`ci-cd-automation`** - Pipeline automation workflows
    ```
    Use ci-cd-automation skill to create a GitHub Actions workflow for our API tests
    ```

### 📋 **Real-World Workflow Examples**

**Building a new API feature:**
```
1. Use brainstorming skill to design the API
2. Activate backend-architect agent + api-design-principles skill
3. Use test-driven-development skill to implement with tests
4. Activate code-review-excellence skill before merging
5. Use kubernetes-deployment skill to create K8s manifests
```

**Debugging a production issue:**
```
Activate the senior-developer agent, then use systematic-debugging skill 
to help me trace this timeout in our payment service
```

**Setting up new infrastructure:**
```
Use kubernetes-deployment and gitops-workflow skills to help me deploy 
our new service with Flux CD
```

**Security audit before release:**
```
Activate security-engineer agent + api-security-testing skill to audit 
our new authentication endpoints
```

### 💡 **Combining Agents + Skills**

The real power comes from combining agent personas with skill methodologies:

```
Activate the backend-architect agent, then use the api-design-principles 
and test-driven-development skills to help me build a new payment API 
with comprehensive tests
```

This gives you:
- **Agent expertise** (backend architecture knowledge)
- **Skill methodologies** (API design + TDD workflows)
- **Systematic approach** (following proven patterns)

### 🔍 **Discover More Skills**

```
Search for skills about terraform        # Infrastructure as Code
Search for skills about docker           # Containerization
Search for skills about monitoring       # Observability
Search for skills about graphql          # GraphQL APIs
List skills in the devops category       # All DevOps skills
```

---
## Adding Custom Agents
Drop a Markdown file into \`./agents/\` in the project directory. The format is:
\`\`\`markdown
---
name: My Custom Agent
description: One-line summary of what this agent does
---
# My Custom Agent
You are **My Custom Agent**. You specialise in...
(full instructions and personality here)
\`\`\`
Only \`name\` and \`description\` from the frontmatter are used by the server. Everything below the frontmatter is the persona body that gets sent to the AI.
Restart the IDE or rebuild the Docker image after adding new agents.
---
## Shared Instructions (Clean Code & More)
The server supports **shared instructions** — Markdown files that are automatically prepended to every agent activation. This is how you enforce baseline standards (clean code, security guidelines, project conventions, etc.) across all 160+ agent personas.
A default \`clean-code.md\` is included in \`./shared-instructions/\`. It covers naming, SOLID, DRY/KISS/YAGNI, testing, error handling, and more.
### Where they live
Instructions are stored in \`./shared-instructions/\` in the project directory.
### Customising
- **Edit** \`./shared-instructions/clean-code.md\` to match your team's standards.
- **Add** more \`.md\` files (e.g. \`project-conventions.md\`, \`security-policy.md\`) — all files are loaded and concatenated alphabetically.
- **Remove** any file you don't want.
- Restart the IDE or rebuild the Docker image after changes.
### Viewing in chat
Ask Copilot:
\`\`\`
Show me the shared instructions
\`\`\`
This calls the \`get_shared_instructions\` tool and shows exactly what baseline rules are being applied.
---
## Updating Agents
Agents are included in the repository. To get the latest:
\`\`\`bash
git pull origin main
\`\`\`
Then restart the IDE or rebuild the Docker image.
---
## Uninstall
To remove the IDE integration, simply delete the \`"agency-agents"\` block from your \`mcp.json\` file and restart the IDE.
For Docker deployments, stop and remove the container:
\`\`\`bash
docker stop agency-agents-mcp
docker rm agency-agents-mcp
# Optional: remove the image
docker rmi agency-agents-mcp:latest
\`\`\`
---
## Directory Layout
\`\`\`
agency-agents-mcp/
├── agents/                                   # 160+ agent persona .md files
│   ├── engineering-backend-architect.md
│   ├── engineering-code-reviewer.md
│   ├── engineering-security-engineer.md
│   ├── design-ux-architect.md
│   └── ... (160+ files)
├── skills/                                   # 1,400+ specialized skills
│   ├── brainstorming/
│   │   └── SKILL.md
│   ├── test-driven-development/
│   │   └── SKILL.md
│   ├── security-audit/
│   │   └── SKILL.md
│   └── ... (1,400+ skills)
├── shared-instructions/                      # Shared standards applied to ALL agents
│   └── clean-code.md
├── skills_index.json                         # Skills metadata index
├── build/
│   └── azure-devops/
│       ├── azure-pipelines.yml               # Pipeline template
│       └── buildimages.yaml                  # Build job definitions
├── server.mjs                                # MCP server (stdio protocol)
├── http-wrapper.mjs                          # HTTP wrapper for production
├── mcp-http-bridge.mjs                       # HTTP-to-stdio bridge for IDE
├── package.json
├── package-lock.json
├── Dockerfile                                # Docker image definition
├── docker-compose.yml                        # Docker Compose config
├── .dockerignore                             # Docker build exclusions
├── azure-pipelines.yml                       # Main Azure pipeline
└── node_modules/
IDE Config Files:
~/.config/github-copilot/intellij/mcp.json    # Rider/IntelliJ (Linux/macOS)
~/.config/github-copilot/vscode/mcp.json      # VS Code (Linux/macOS)
%APPDATA%\\github-copilot\\intellij\\mcp.json    # Rider/IntelliJ (Windows)
%APPDATA%\\github-copilot\\vscode\\mcp.json      # VS Code (Windows)
\`\`\`
---
## Troubleshooting
| Symptom | Fix |
|---|---|
| **MCP server doesn't start / tools not showing** | Open \`mcp.json\` and check that \`"command"\` is the **absolute path** to node (e.g. \`/usr/bin/node\`, not just \`node\`). IDEs don't inherit your shell PATH. Run \`which node\` to find it. |
| Copilot doesn't show the agent tools | Restart the IDE. Verify \`mcp.json\` exists in the correct directory and uses absolute paths. |
| Server crashes on startup | Run \`node server.mjs\` from the project directory manually to see the error. Usually a missing \`npm install\`. |
| "No agents installed" response | Check \`./agents/\` has \`.md\` files. Verify you're running from the correct directory. |
| \`node: command not found\` | Ensure Node >= 18 is installed and on your \`PATH\`. Use the absolute path in \`mcp.json\`. |
| Works in VS Code but not Rider (or vice versa) | Each IDE has its own \`mcp.json\` path. Make sure you created the config in the right directory. |
| Already have other MCP servers in \`mcp.json\` | Merge the \`"agency-agents"\` block into your existing \`servers\` object rather than replacing the file. |
| Docker build fails | Ensure Docker is installed and running. Check that all files are present in the build context. |
| Pipeline fails in Azure DevOps | Verify the agent pool name (\`BlueMountain-PROD\`) and service connection ID match your Azure setup. |
---
## How It Works
1. The Copilot plugin reads \`mcp.json\` at startup and spawns \`node server.mjs\` as a child process.
2. The server communicates with Copilot over **stdin/stdout** using the Model Context Protocol.
3. When you ask Copilot to list or activate an agent, it calls the MCP tool.
4. The server reads the matching \`.md\` file from \`./agents/\` and returns the persona text, **prepended with any shared instructions** from \`./shared-instructions/\`.
5. Copilot adopts those instructions (shared standards + agent persona) for the remainder of the conversation.
The server is stateless. It reads all agent files once at startup and serves them from memory. No network calls, no external dependencies at runtime.
### Docker Deployment
When deployed as a Docker container:
1. The Dockerfile packages the entire application including all agent definitions.
2. The Azure DevOps pipeline automatically builds and tags images on every commit.
3. Images are pushed to Azure Container Registry (\`bluemountain.azurecr.io\`).
4. The container can be deployed to any Docker-compatible environment.
---
## Documentation

### Quick References
- **[Quick Reference](QUICK-REFERENCE.md)** ⭐ - **Start here!** One-page cheat sheet with top 10 skills, ready-to-use commands, and real-world workflows for development teams
- **[Skills Guide](SKILLS-GUIDE.md)** - Comprehensive guide to all 1,400+ skills, categories, and best practices
- **[Skills Integration Summary](SKILLS-INTEGRATION-COMPLETE.md)** - Technical implementation summary and integration details
- **[Changelog](CHANGELOG.md)** - Version history and release notes

### Key Topics
- **Agents** - See "Working with Agents" section above
- **Skills** - See "For Development Teams: Top 10 Essential Skills" section above
- **Installation** - See "Local Development (IDE Integration)" section above
- **Docker** - See "Docker Deployment" section above
- **Troubleshooting** - See "Troubleshooting" section below

---
## Credits
Agent personas sourced from [msitarzewski/agency-agents](https://github.com/msitarzewski/agency-agents).
Skills sourced from [sickn33/antigravity-awesome-skills](https://github.com/sickn33/antigravity-awesome-skills).
MCP server built on the [@modelcontextprotocol/sdk](https://www.npmjs.com/package/@modelcontextprotocol/sdk).
---
## Licence
MIT

