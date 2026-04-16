# MCP Server Test Results - https://agency-agents-mcp.regtransfers.dev/

**Date:** April 16, 2026  
**Environment:** Dev (Kubernetes)

---

## Test Results

### ✅ Pod Health Check (Internal)

**Direct kubectl exec test:**
```json
{
  "status": "healthy",
  "timestamp": "2026-04-16T15:09:48.187Z",
  "agents": {
    "total": 144,
    "directory": "/app/agents"
  },
  "sharedInstructions": {
    "loaded": true,
    "directory": "/app/shared-instructions"
  }
}
```

**Status:** ✅ **MCP SERVER IS RUNNING AND HEALTHY**
- ✅ 144 agents loaded
- ✅ Shared instructions loaded
- ✅ JSON-RPC responding via stdin/stdout

---

### ❌ External HTTPS Access

**URL Tested:** https://agency-agents-mcp.regtransfers.dev/

**Result:** `404 Not Found` (nginx)

**All paths tested returned 404:**
- `/` - 404
- `/healthz` - 404  
- `/health` - 404
- `/api` - 404
- POST with JSON-RPC payload - 404

---

## The Problem

**MCP uses stdio (stdin/stdout) for JSON-RPC communication, NOT HTTP.**

The Ingress is configured and SSL is working, but:
1. The MCP server only accepts stdio input (not HTTP requests)
2. There's no HTTP-to-stdio adapter deployed
3. nginx can't route HTTP traffic to a stdio-based server

---

## Solution Options

### Option 1: Deploy an HTTP Wrapper (Recommended)

Create a Node.js HTTP/WebSocket proxy that:
- Accepts HTTP POST requests with JSON-RPC payloads
- Pipes them to the MCP server's stdin
- Returns the stdout responses as HTTP responses

**Example wrapper:**
```javascript
const express = require('express');
const { spawn } = require('child_process');

const app = express();
app.use(express.json());

app.post('/', (req, res) => {
  const mcp = spawn('node', ['server.mjs']);
  
  mcp.stdin.write(JSON.stringify(req.body) + '\n');
  mcp.stdin.end();
  
  let output = '';
  mcp.stdout.on('data', (data) => {
    output += data.toString();
  });
  
  mcp.on('close', () => {
    res.json(JSON.parse(output));
  });
});

app.listen(3000);
```

### Option 2: WebSocket Proxy

Use WebSocket for bidirectional communication:
- Client connects via WebSocket
- Messages proxied to MCP server stdin/stdout
- Maintains persistent connection

### Option 3: Use IDE Integration (Current Working Method)

Configure IDE to connect via kubectl exec:

```json
// .config/github-copilot/vscode/mcp.json
{
  "servers": {
    "agency-agents": {
      "type": "stdio",
      "command": "kubectl",
      "args": [
        "exec",
        "-i",
        "-n",
        "bluemountain",
        "agency-agents-mcp-5975b5db8f-znsgx",
        "--",
        "node",
        "server.mjs"
      ]
    }
  }
}
```

This works perfectly - Copilot communicates directly with the K8s-hosted server via stdio.

---

## Current Status

| Component | Status | Details |
|-----------|--------|---------|
| **MCP Server** | ✅ RUNNING | 144 agents loaded |
| **Pod** | ✅ HEALTHY | agency-agents-mcp-5975b5db8f-znsgx |
| **Ingress** | ✅ CONFIGURED | SSL working, DNS resolving |
| **HTTP Access** | ❌ NOT WORKING | 404 - No HTTP adapter |
| **kubectl exec** | ✅ WORKING | Direct stdio access works perfectly |

---

## Recommendation

**For production use with HTTP access:**

1. Create an HTTP wrapper service
2. Deploy it as a sidecar container or separate service
3. Have it proxy HTTP → stdio → MCP server → stdio → HTTP

**For IDE integration (recommended):**

Just use kubectl exec - it works perfectly and maintains the stdio protocol.

---

## Working Test Command

```bash
# This works perfectly:
kubectl exec -n bluemountain agency-agents-mcp-5975b5db8f-znsgx -- \
  /bin/sh -c "echo '{\"jsonrpc\":\"2.0\",\"id\":5,\"method\":\"tools/call\",\"params\":{\"name\":\"healthz\",\"arguments\":{}}}' | node server.mjs"
```

**The MCP server is healthy and functional - it just needs an HTTP adapter for web access.**

