# RPC-Based Health Check Endpoint

## Overview

The agency-agents-mcp server includes an RPC-based `healthz` tool for Kubernetes health probes. Since MCP uses stdio/JSON-RPC communication (not HTTP), health checks must also use the RPC protocol.

## The healthz Tool

The server exposes a fifth tool called `healthz` that returns server health status:

```javascript
server.tool("healthz", "Health check endpoint...", {}, async () => {
  const agentCount = catalogue.size;
  const hasSharedInstructions = sharedInstructions.length > 0;
  const isHealthy = agentCount > 0;
  
  return {
    content: [{
      type: "text",
      text: JSON.stringify({
        status: isHealthy ? "healthy" : "unhealthy",
        timestamp: new Date().toISOString(),
        agents: {
          total: agentCount,
          directory: AGENTS_DIR,
        },
        sharedInstructions: {
          loaded: hasSharedInstructions,
          directory: SHARED_INSTRUCTIONS_DIR,
        },
      }, null, 2)
    }]
  };
});
```

## Testing Locally

Test the healthz endpoint by sending a JSON-RPC message via stdin:

```bash
echo '{"jsonrpc":"2.0","id":5,"method":"tools/call","params":{"name":"healthz","arguments":{}}}' | node server.mjs
```

Expected response:

```json
{
  "jsonrpc": "2.0",
  "id": 5,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"status\": \"healthy\",\n  \"timestamp\": \"2026-04-16T10:43:27.413Z\",\n  \"agents\": {\n    \"total\": 144,\n    \"directory\": \"/app/agents\"\n  },\n  \"sharedInstructions\": {\n    \"loaded\": true,\n    \"directory\": \"/app/shared-instructions\"\n  }\n}"
      }
    ]
  }
}
```

## Testing with Docker

```bash
# Start the debug container
docker-compose -f docker-compose.debug.yml up -d

# Test healthz endpoint
echo '{"jsonrpc":"2.0","id":5,"method":"tools/call","params":{"name":"healthz","arguments":{}}}' | \
  docker exec -i agency-agents-mcp-debug node server.mjs | \
  grep -q 'status.*healthy' && echo "✅ Healthy" || echo "❌ Unhealthy"
```

## Kubernetes Integration

### exec Probe Configuration

Since the MCP server uses stdio (not HTTP), Kubernetes health probes must use `exec` commands instead of `httpGet`:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: agency-agents-mcp
spec:
  containers:
  - name: mcp-server
    image: bluemountain.azurecr.io/agency-agents-mcp:latest
    
    # Liveness probe - restart if unhealthy
    livenessProbe:
      exec:
        command:
        - /bin/sh
        - -c
        - |
          echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"healthz","arguments":{}}}' | node server.mjs | grep -q 'status.*healthy'
      initialDelaySeconds: 10
      periodSeconds: 30
      timeoutSeconds: 5
      failureThreshold: 3
    
    # Readiness probe - don't send traffic until ready
    readinessProbe:
      exec:
        command:
        - /bin/sh
        - -c
        - |
          echo '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"healthz","arguments":{}}}' | node server.mjs | grep -q 'status.*healthy'
      initialDelaySeconds: 5
      periodSeconds: 10
      timeoutSeconds: 3
      successThreshold: 1
      failureThreshold: 3
    
    # Startup probe - wait for agents to load
    startupProbe:
      exec:
        command:
        - /bin/sh
        - -c
        - |
          echo '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"healthz","arguments":{}}}' | node server.mjs | grep -q 'status.*healthy'
      initialDelaySeconds: 2
      periodSeconds: 2
      timeoutSeconds: 2
      failureThreshold: 30  # 60 seconds total
```

### How It Works

1. **exec command**: Kubernetes runs a shell command inside the container
2. **JSON-RPC message**: Echo the healthz tool call request to stdin
3. **Pipe to node**: The message is piped to `node server.mjs`
4. **grep for status**: Search for `"status":"healthy"` in the JSON response
5. **Exit code**: `grep -q` returns 0 (success) if found, 1 (failure) if not

### Probe Types

- **livenessProbe**: If fails, Kubernetes restarts the container
- **readinessProbe**: If fails, Kubernetes removes the pod from service endpoints
- **startupProbe**: Gives the application time to start before liveness checks begin

## Why RPC Instead of HTTP?

The MCP (Model Context Protocol) uses stdio for communication:

- **stdin**: Receives JSON-RPC requests
- **stdout**: Sends JSON-RPC responses
- **No HTTP server**: The process doesn't listen on any network port (except debug port)

Therefore, health checks must also use the RPC protocol via stdin/stdout, not HTTP endpoints.

## Health Check Logic

The server is considered **healthy** if:

- ✅ Agent catalogue has loaded (agentCount > 0)
- ✅ Server process is running and responding to RPC calls

The server is considered **unhealthy** if:

- ❌ No agents loaded (agentCount === 0)
- ❌ Process crashes or hangs

## Monitoring Health Status

Extract specific health metrics:

```bash
# Get full health status
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"healthz","arguments":{}}}' | \
  node server.mjs | \
  jq -r '.result.content[0].text | fromjson'

# Check if healthy
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"healthz","arguments":{}}}' | \
  node server.mjs | \
  jq -r '.result.content[0].text | fromjson | .status'

# Get agent count
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"healthz","arguments":{}}}' | \
  node server.mjs | \
  jq -r '.result.content[0].text | fromjson | .agents.total'
```

## Production Deployment

For production deployments:

1. **Use the exec probe pattern** shown in `k8s-example.yaml`
2. **Adjust timing parameters** based on your startup time
3. **Monitor probe failures** in Kubernetes events
4. **Set appropriate resource limits** to ensure probes don't timeout

See `k8s-example.yaml` for a complete working example.



