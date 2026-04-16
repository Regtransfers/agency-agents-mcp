# Deployment Checklist

## ✅ Completed Tasks

### Code Changes
- [x] Updated `server.mjs` to use local `./agents/` and `./shared-instructions/` folders
- [x] Added ES module `__dirname` support using `fileURLToPath` and `dirname`
- [x] Removed install scripts: `install.sh`, `install.ps1`, `uninstall.sh`, `uninstall.ps1`

### Docker Configuration
- [x] Created `Dockerfile` based on `node:20-bookworm`
- [x] Created `docker-compose.yml` for local development
- [x] Created `.dockerignore` to exclude unnecessary files

### Azure DevOps Pipeline
- [x] Created `azure-pipelines.yml` (root) - main pipeline
- [x] Created `build/azure-devops/azure-pipelines.yml` - template approach
- [x] Created `build/azure-devops/buildimages.yaml` - build job definitions

### Documentation
- [x] Updated `README.md` with Docker deployment instructions
- [x] Created `MIGRATION.md` with complete change summary
- [x] Created this checklist

## 🧪 Testing Steps

### 1. Local Docker Build Test
```bash
cd /home/aaron/github/agency-agents-mcp
docker build -t agency-agents-mcp:test .
```
**Expected**: Build completes successfully without errors

### 2. Local Docker Run Test
```bash
docker run -it --rm agency-agents-mcp:test
```
**Expected**: Server starts and waits for stdin (press Ctrl+C to exit)

### 3. Docker Compose Test
```bash
docker-compose build
docker-compose up
```
**Expected**: Service starts successfully

### 4. Verify Server Loads Agents
```bash
# Run with environment override to verify path resolution
docker run -it --rm agency-agents-mcp:test node -e "
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const agents = readdirSync(join(__dirname, 'agents')).filter(f => f.endsWith('.md'));
console.log(\`Found \${agents.length} agent files\`);
"
```
**Expected**: Output shows agent count (should be 160+)

## 🚀 Deployment Steps

### Step 1: Commit Changes
```bash
git add .
git commit -m "Add Docker support and Azure DevOps pipeline

- Migrate to Docker-based deployment
- Update server to use local agents/shared-instructions folders
- Add Azure DevOps CI/CD pipeline
- Remove legacy install/uninstall scripts
- Update documentation for Docker deployment"
```

### Step 2: Push to Repository
```bash
git push origin main
```

### Step 3: Verify Azure DevOps Pipeline
1. Navigate to Azure DevOps: https://dev.azure.com/[your-org]/[your-project]
2. Go to Pipelines
3. Look for the pipeline run triggered by your commit
4. Verify build completes successfully
5. Check that image is pushed to `bluemountain.azurecr.io`

### Step 4: Verify Container Registry
```bash
# Login to Azure Container Registry
az acr login --name bluemountain

# List images
az acr repository list --name bluemountain --output table

# Show tags for agency-agents-mcp
az acr repository show-tags --name bluemountain --repository agency-agents-mcp --output table
```
**Expected**: See new image with `{buildNumber}-alpha` tag

### Step 5: Test Deployed Image
```bash
# Pull the image
docker pull bluemountain.azurecr.io/agency-agents-mcp:latest

# Run it
docker run -it --rm bluemountain.azurecr.io/agency-agents-mcp:latest
```
**Expected**: Server starts successfully

## 📝 Configuration Notes

### Azure DevOps Variables
The pipeline uses these variables (verify they match your setup):
- **Agent Pool**: `BlueMountain-PROD`
- **Service Connection**: `5a653e15-c072-4698-b95d-ad5bf4f5775d`
- **Container Registry**: `bluemountain.azurecr.io`
- **Repository**: `agency-agents-mcp`

### Environment Variables (Optional)
Override default paths if needed:
- `AGENTS_DIR`: Custom path to agent definitions
- `SHARED_INSTRUCTIONS_DIR`: Custom path to shared instructions

## 🔍 Troubleshooting

### Docker Build Fails
**Check**: 
- All files are present (especially `agents/` folder with .md files)
- `.dockerignore` isn't excluding required files
- `package.json` and `package-lock.json` are present

**Fix**: Review error message, ensure all dependencies are available

### Pipeline Fails
**Check**:
- Agent pool name is correct
- Service connection ID matches your Azure setup
- Container registry credentials are valid

**Fix**: Update `azure-pipelines.yml` with correct values

### Server Can't Find Agents
**Check**:
- `agents/` folder exists in Docker image
- Files have `.md` extension
- Permissions are set correctly (755 for directories)

**Fix**: Rebuild image, verify Dockerfile copies `agents/` folder

## ✨ Success Criteria

- ✅ Local Docker build completes without errors
- ✅ Server starts and loads all agent definitions
- ✅ Azure DevOps pipeline runs successfully
- ✅ Image appears in Azure Container Registry
- ✅ Pulled image runs correctly
- ✅ Documentation is complete and accurate

## 📚 Additional Resources

- **Docker Documentation**: https://docs.docker.com/
- **Azure DevOps Pipelines**: https://docs.microsoft.com/azure/devops/pipelines/
- **MCP Protocol**: https://modelcontextprotocol.io/
- **Original Agent Repository**: https://github.com/msitarzewski/agency-agents

---

**Date Completed**: April 16, 2026
**Next Review**: When new features are added or deployment issues arise

