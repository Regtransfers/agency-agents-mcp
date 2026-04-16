# Debugging the Agency Agents MCP Server with Docker

This guide explains how to debug the MCP server running inside a Docker container.

## Overview

The project includes debugging configurations for:
- **VS Code**: `.vscode/launch.json` and `.vscode/tasks.json`
- **JetBrains (Rider/IntelliJ)**: `.idea/runConfigurations/`
- **Docker Compose**: `docker-compose.debug.yml`

## Quick Start

### Option 1: Using Docker Compose (Recommended)

```bash
# Start the debug container
docker-compose -f docker-compose.debug.yml up -d

# The debugger is now listening on port 9229
# Attach your IDE debugger to localhost:9229

# View logs
docker-compose -f docker-compose.debug.yml logs -f

# Stop the debug container
docker-compose -f docker-compose.debug.yml down
```

### Option 2: Using Docker Directly

```bash
# Build the debug image
docker build -f Dockerfile.dev -t agency-agents-mcp:debug .

# Run with debugger enabled
docker run -it --rm \
  -p 9229:9229 \
  -v $(pwd)/server.mjs:/app/server.mjs:ro \
  -v $(pwd)/agents:/app/agents:ro \
  -v $(pwd)/shared-instructions:/app/shared-instructions:ro \
  agency-agents-mcp:debug
```

## VS Code Debugging

### Setup

1. The configurations are already created in `.vscode/launch.json`
2. Open the project in VS Code
3. Go to the Debug panel (Ctrl+Shift+D / Cmd+Shift+D)

### Available Configurations

#### 1. **Docker: Debug MCP Server** (Recommended)
- Automatically starts the Docker container with debugger
- Attaches VS Code to the running container
- Hot-reloads code changes (volume mounts)

**To use:**
1. Select "Docker: Debug MCP Server" from the debug dropdown
2. Press F5 or click the green play button
3. Set breakpoints in `server.mjs`
4. The container will start automatically

#### 2. **Local: Debug MCP Server**
- Runs the server locally (no Docker)
- Fastest for rapid development
- Requires `npm install` first

**To use:**
1. Run `npm install` first
2. Select "Local: Debug MCP Server"
3. Press F5
4. Set breakpoints and debug

#### 3. **Docker: Attach to Running Container**
- Attaches to an already-running debug container
- Use when you started the container manually

**To use:**
1. Start container: `docker-compose -f docker-compose.debug.yml up -d`
2. Select "Docker: Attach to Running Container"
3. Press F5

### VS Code Tasks

The following tasks are available via `Ctrl+Shift+P` → "Tasks: Run Task":

- **docker-debug-up**: Start the debug container
- **docker-debug-down**: Stop the debug container
- **docker-debug-logs**: View container logs
- **docker-build-test**: Build production image
- **docker-build-dev**: Build development/debug image

## JetBrains Rider / IntelliJ IDEA Debugging

### Setup

1. The configurations are already created in `.idea/runConfigurations/`
2. Open the project in Rider or IntelliJ IDEA
3. The debug configurations will appear in the run/debug dropdown

### Available Configurations

#### 1. **Docker: Debug MCP Server**
- Builds and runs the debug Docker container
- Exposes ports 9229 (debugger) and 3000 (app)

**To use:**
1. Select "Docker: Debug MCP Server" from the dropdown
2. Click the debug button (or press Shift+F9)
3. Container will start with debugger enabled

#### 2. **Attach to Docker Debugger**
- Attaches to an already-running debug container
- Use when container is started separately

**To use:**
1. Start container: `docker-compose -f docker-compose.debug.yml up -d`
2. Select "Attach to Docker Debugger"
3. Click the debug button

### Setting Breakpoints

1. Open `server.mjs`
2. Click in the gutter (left of line numbers) to set breakpoints
3. Red circles indicate active breakpoints
4. Start debugging to hit the breakpoints

## Architecture

### Development vs Production Dockerfiles

| File | Purpose | Features |
|------|---------|----------|
| `Dockerfile` | Production | Minimal, optimized, no debug tools |
| `Dockerfile.dev` | Development | Includes debug support, `--inspect` enabled |

### Debug Configuration

The debug container:
- Exposes port **9229** for the Node.js debugger (V8 Inspector Protocol)
- Exposes port **3000** for the application (if needed)
- Mounts source code as volumes for hot-reload
- Runs with `node --inspect=0.0.0.0:9229 server.mjs`

### Volume Mounts

In debug mode, these files are mounted from your local filesystem:
- `./server.mjs` → `/app/server.mjs` (read-only)
- `./agents/` → `/app/agents/` (read-only)
- `./shared-instructions/` → `/app/shared-instructions/` (read-only)

This allows you to edit code locally and see changes without rebuilding the image.

## Debugging Workflow

### Typical Workflow

1. **Start the debug container:**
   ```bash
   docker-compose -f docker-compose.debug.yml up -d
   ```

2. **Attach your IDE debugger** (VS Code: F5, Rider: Shift+F9)

3. **Set breakpoints** in `server.mjs`

4. **Trigger the code:**
   - For MCP servers, you'll need to send stdin commands
   - Or configure your IDE's MCP plugin to connect to the server

5. **Edit code:**
   - Changes to mounted files (server.mjs, agents, etc.) are visible immediately
   - Restart the container to pick up changes:
     ```bash
     docker-compose -f docker-compose.debug.yml restart
     ```

6. **View logs:**
   ```bash
   docker-compose -f docker-compose.debug.yml logs -f
   ```

7. **Stop debugging:**
   ```bash
   docker-compose -f docker-compose.debug.yml down
   ```

## Troubleshooting

### Debugger Won't Attach

**Problem**: "Cannot connect to the target: connect ECONNREFUSED"

**Solutions:**
1. Check container is running: `docker ps | grep agency-agents-mcp-debug`
2. Check port 9229 is exposed: `docker port agency-agents-mcp-debug`
3. Verify debugger is listening:
   ```bash
   docker logs agency-agents-mcp-debug
   ```
   Should see: `Debugger listening on ws://0.0.0.0:9229/...`

### Changes Not Reflecting

**Problem**: Code changes don't appear in the running container

**Solutions:**
1. Verify volumes are mounted:
   ```bash
   docker inspect agency-agents-mcp-debug | grep Mounts -A 20
   ```
2. Restart the container:
   ```bash
   docker-compose -f docker-compose.debug.yml restart
   ```
3. If still not working, rebuild:
   ```bash
   docker-compose -f docker-compose.debug.yml up --build -d
   ```

### Breakpoints Not Hitting

**Problem**: Debugger attached but breakpoints are grey/not hitting

**Solutions:**
1. Verify source maps are correct
2. Check `localRoot` and `remoteRoot` in launch.json:
   - `localRoot`: `${workspaceFolder}` (your local project)
   - `remoteRoot`: `/app` (path inside container)
3. Ensure the code being executed matches your local files

### Port Already in Use

**Problem**: "Error starting userland proxy: listen tcp4 0.0.0.0:9229: bind: address already in use"

**Solutions:**
1. Stop any other Node.js debuggers:
   ```bash
   lsof -i :9229
   kill -9 <PID>
   ```
2. Stop other debug containers:
   ```bash
   docker ps -a | grep debug
   docker stop <container-id>
   ```

## Advanced Usage

### Custom Environment Variables

Edit `docker-compose.debug.yml` to add environment variables:

```yaml
services:
  agency-agents-mcp-debug:
    environment:
      - NODE_ENV=development
      - AGENTS_DIR=/app/agents
      - SHARED_INSTRUCTIONS_DIR=/app/shared-instructions
      - DEBUG=mcp:*  # Enable debug logging
```

### Remote Debugging

To debug from a different machine:

1. Expose port 9229 in docker-compose:
   ```yaml
   ports:
     - "0.0.0.0:9229:9229"
   ```

2. Update your IDE's debug config to use the remote IP:
   ```json
   {
     "address": "192.168.1.100",  // Your Docker host IP
     "port": 9229
   }
   ```

### Debugging Tests

To debug tests in Docker:

1. Add a test script to `package.json`:
   ```json
   {
     "scripts": {
       "test:debug": "node --inspect-brk=0.0.0.0:9229 --test"
     }
   }
   ```

2. Update docker-compose.debug.yml command:
   ```yaml
   command: ["npm", "run", "test:debug"]
   ```

## Files Reference

| File | Purpose |
|------|---------|
| `Dockerfile.dev` | Development Docker image with debug support |
| `docker-compose.debug.yml` | Docker Compose for debugging |
| `.vscode/launch.json` | VS Code debug configurations |
| `.vscode/tasks.json` | VS Code build/run tasks |
| `.idea/runConfigurations/*.xml` | JetBrains debug configurations |

## See Also

- [Node.js Debugging Guide](https://nodejs.org/en/docs/guides/debugging-getting-started/)
- [VS Code Docker Debugging](https://code.visualstudio.com/docs/containers/debug-common)
- [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/)

