#!/usr/bin/env node

/**
 * MCP HTTP Bridge - Stdio to HTTP adapter
 * 
 * Standalone bridge for connecting IDEs to remote MCP servers via HTTPS.
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
import { stdin, stdout } from 'process';

const MCP_URL = process.env.MCP_URL || 'https://agency-agents-mcp.regtransfers.dev';

const rl = createInterface({
  input: stdin,
  output: process.stdout,
  terminal: false
});

rl.on('line', async (line) => {
  try {
    const request = JSON.parse(line);
    
    // Forward to HTTP endpoint
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
    
    // Write response to stdout
    stdout.write(JSON.stringify(result) + '\n');
  } catch (error) {
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
      id: null
    };
    stdout.write(JSON.stringify(errorResponse) + '\n');
  }
});


