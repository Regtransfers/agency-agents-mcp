# Agency Agents MCP - Migration to Docker & Azure DevOps Summary

## Completed Changes

### 1. ✅ Removed Install/Uninstall Scripts
- Deleted: `install.sh`, `install.ps1`, `uninstall.sh`, `uninstall.ps1`
- Reason: No longer needed with Docker-based deployment

### 2. ✅ Updated Server Code
**File**: `server.mjs`
- Changed agents directory from `~/.github/agents/` to `./agents/` (local project folder)
- Changed shared-instructions from `~/.github/shared-instructions/` to `./shared-instructions/`
- Added support for `__dirname` in ES modules using `fileURLToPath` and `dirname`
- Environment variables `AGENTS_DIR` and `SHARED_INSTRUCTIONS_DIR` can still override defaults

### 3. ✅ Created Docker Configuration

**Dockerfile**:
- Based on `node:20-bookworm`
- Installs dependencies with `npm install --legacy-peer-deps`
- Copies entire project including `agents/` and `shared-instructions/`
- Sets proper permissions for directories
- Exposes port 3000 (not strictly needed for stdio MCP but good practice)
- Production-ready with minimal footprint

**docker-compose.yml**:
- Service definition for local development
- Volume mounts for `agents/` and `shared-instructions/` (read-only)
- Tag support via `TAG` environment variable
- Configured for Azure Container Registry: `bluemountain.azurecr.io/agency-agents-mcp`

**.dockerignore**:
- Excludes `node_modules`, build artifacts, IDE configs
- **Includes** agent and shared-instruction markdown files (critical!)
- Excludes old install/uninstall scripts

### 4. ✅ Created Azure DevOps Pipeline

**azure-pipelines.yml** (root):
- Triggers on `main` and `master` branches
- Build number format: `yyyyMMdd.rr` (e.g., 20260416.01)
- Uses Docker@2 task to build and push to Azure Container Registry
- Tags images with `{buildNumber}-alpha`
- Configured for `BlueMountain-PROD` agent pool
- Service connection ID: `5a653e15-c072-4698-b95d-ad5bf4f5775d`

**build/azure-devops/azure-pipelines.yml** (template):
- Alternative template-based approach
- Triggers on code changes in `agents/`, `shared-instructions/`, `server.mjs`, etc.
- Delegates to `buildimages.yaml`

**build/azure-devops/buildimages.yaml**:
- Job for PR builds (builds locally without push)
- Job for main/master builds (builds and pushes to ACR)
- Tags: `{buildNumber}-alpha` and `latest`

### 5. ✅ Updated README.md
- Added Docker deployment section (now the recommended method)
- Updated all installation instructions to use local project directories
- Removed references to `~/.github/` home directory installation
- Added troubleshooting for Docker and Azure DevOps
- Documented new directory structure
- Simplified uninstall instructions

## Directory Structure

```
agency-agents-mcp/
├── agents/                                   # 160+ agent persona .md files
├── shared-instructions/                      # Shared standards (clean code, etc.)
├── build/
│   └── azure-devops/
│       ├── azure-pipelines.yml               # Pipeline template
│       └── buildimages.yaml                  # Build job definitions
├── server.mjs                                # MCP server (updated paths)
├── package.json
├── package-lock.json
├── Dockerfile                                # NEW: Docker image definition
├── docker-compose.yml                        # NEW: Docker Compose config
├── .dockerignore                             # NEW: Docker build exclusions
├── azure-pipelines.yml                       # NEW: Main Azure pipeline
├── README.md                                 # UPDATED: Docker-aware docs
└── LICENSE
```

## How to Use

### Local Development (IDE Integration)
```bash
git clone https://github.com/Regtransfers/agency-agents-mcp.git
cd agency-agents-mcp
npm install
# Then configure mcp.json in IDE (see README)
```

### Docker Build
```bash
docker build -t agency-agents-mcp:latest .
docker run -it agency-agents-mcp:latest
```

### Docker Compose
```bash
docker-compose up --build
```

### Azure DevOps
- Push to `main` branch
- Pipeline automatically triggers
- Image builds and pushes to `bluemountain.azurecr.io/agency-agents-mcp:{buildNumber}-alpha`

## Environment Variables

The server supports these optional overrides:
- `AGENTS_DIR`: Path to agent definitions (default: `./agents`)
- `SHARED_INSTRUCTIONS_DIR`: Path to shared instructions (default: `./shared-instructions`)

## Next Steps

1. **Test the Docker build locally**:
   ```bash
   docker build -t agency-agents-mcp:test .
   ```

2. **Test the server works**:
   ```bash
   docker run -it --rm agency-agents-mcp:test
   # Should start and wait for stdin
   ```

3. **Commit and push to trigger pipeline**:
   ```bash
   git add .
   git commit -m "Add Docker support and Azure DevOps pipeline"
   git push origin main
   ```

4. **Verify in Azure DevOps**:
   - Check pipeline runs successfully
   - Verify image appears in `bluemountain.azurecr.io`

## Benefits

✅ **No more manual installation** - Everything is containerized
✅ **Reproducible builds** - Same environment everywhere
✅ **Automated CI/CD** - Every commit builds a new image
✅ **Easy deployment** - Pull and run from ACR
✅ **Simplified local development** - Just clone and run
✅ **Version control friendly** - All agents and instructions in repo

## Breaking Changes

⚠️ **Old installation method no longer supported**
- Users who previously installed to `~/.github/` will need to:
  1. Clone the repo
  2. Run from the project directory
  3. Update their `mcp.json` to point to the new location

The server will automatically use local folders instead of home directory.

