#!/usr/bin/env node

/**
 * MCP HTTP Bridge - Stdio to HTTP adapter
 * 
 * Standalone bridge for connecting IDEs to remote MCP servers via HTTPS.
 * Handles MCP protocol initialization and proxies all standard MCP methods.
 * 
 * Installation (one-time):
 *   curl -o ~/.local/bin/mcp-http-bridge https://raw.githubusercontent.com/Regtransfers/agency-agents-mcp/main/mcp-http-bridge.mjs
 *   chmod +x ~/.local/bin/mcp-http-bridge
 * 
 * Usage in mcp.json:
 *   "command": "/home/username/.local/bin/mcp-http-bridge",
 *   "env": { "MCP_URL": "https://agency-agents-mcp.regtransfers.dev" }
 * 
 * No project clone required!
 */

import { createInterface } from 'readline';
import { stdin, stdout, stderr } from 'process';

const MCP_URL = process.env.MCP_URL || 'https://agency-agents-mcp.regtransfers.dev';
const DEBUG = process.env.DEBUG === '1';

function log(msg) {
  if (DEBUG) {
    stderr.write(`[bridge] ${msg}\n`);
  }
}

const rl = createInterface({
  input: stdin,
  output: stdout,
  terminal: false
});

// Track if we've sent initialize to the remote server
let initialized = false;

rl.on('line', async (line) => {
  try {
    const request = JSON.parse(line);
    log(`Received request: ${request.method} (id: ${request.id})`);
    
    // Handle notifications (no response expected)
    if (!request.id) {
      log(`Handling notification: ${request.method}`);
      // For notifications like 'notifications/initialized', we don't need to forward
      // Just acknowledge internally
      return;
    }
    
    // For initialize, we might want to intercept and enhance
    if (request.method === 'initialize') {
      log('Handling initialize request');
      // Make sure we send our own initialize to remote
      initialized = true;
    }
    
    // Forward to HTTP endpoint
    log(`Forwarding to ${MCP_URL}`);
    const response = await fetch(MCP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    log(`Got response: ${JSON.stringify(result).substring(0, 200)}`);
    
    // Write response to stdout
    stdout.write(JSON.stringify(result) + '\n');
  } catch (error) {
    log(`Error: ${error.message}`);
    
    // Try to extract request ID from the line
    let requestId = null;
    try {
      const req = JSON.parse(line);
      requestId = req.id;
    } catch (e) {
      // ignore
    }
    
    // Return JSON-RPC error
    const errorResponse = {
      jsonrpc: '2.0',
      error: {
        code: -32603,
        message: 'Internal error',
        data: { 
          error: error.message,
          url: MCP_URL
        }
      },
      id: requestId
    };
    stdout.write(JSON.stringify(errorResponse) + '\n');
  }
});

log('MCP HTTP Bridge started');
log(`Remote URL: ${MCP_URL}`);



