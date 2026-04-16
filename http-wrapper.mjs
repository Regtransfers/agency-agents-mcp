#!/usr/bin/env node

/**
 * HTTP Wrapper for MCP Server
 * Accepts HTTP POST requests with JSON-RPC payloads and pipes them to the MCP stdio server
 */

import express from 'express';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.HTTP_PORT || 3000;

app.use(express.json());

// CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Health check endpoint (simple HTTP)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Root endpoint - info
app.get('/', (req, res) => {
  res.json({
    name: 'agency-agents-mcp',
    version: '1.0.0',
    description: 'HTTP wrapper for MCP stdio server',
    endpoints: {
      'POST /': 'Send JSON-RPC requests to MCP server',
      'GET /health': 'Simple health check'
    },
    example: {
      method: 'POST',
      url: '/',
      body: {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
          name: 'healthz',
          arguments: {}
        }
      }
    }
  });
});

// Main MCP proxy endpoint
app.post('/', (req, res) => {
  console.log('Received JSON-RPC request:', JSON.stringify(req.body));
  
  // Spawn the MCP server process
  const mcp = spawn('node', [join(__dirname, 'server.mjs')], {
    stdio: ['pipe', 'pipe', 'pipe']
  });

  let output = '';
  let errorOutput = '';

  // Capture stdout
  mcp.stdout.on('data', (data) => {
    output += data.toString();
  });

  // Capture stderr
  mcp.stderr.on('data', (data) => {
    errorOutput += data.toString();
    console.error('MCP stderr:', data.toString());
  });

  // Handle process completion
  mcp.on('close', (code) => {
    if (code !== 0) {
      console.error('MCP process exited with code:', code);
      console.error('Error output:', errorOutput);
      return res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal error',
          data: { exitCode: code, stderr: errorOutput }
        },
        id: req.body.id || null
      });
    }

    try {
      const response = JSON.parse(output);
      console.log('MCP response:', JSON.stringify(response));
      res.json(response);
    } catch (err) {
      console.error('Failed to parse MCP response:', err);
      console.error('Raw output:', output);
      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32700,
          message: 'Parse error',
          data: { raw: output }
        },
        id: req.body.id || null
      });
    }
  });

  // Handle spawn errors
  mcp.on('error', (err) => {
    console.error('Failed to spawn MCP process:', err);
    res.status(500).json({
      jsonrpc: '2.0',
      error: {
        code: -32603,
        message: 'Internal error',
        data: { error: err.message }
      },
      id: req.body.id || null
    });
  });

  // Write the JSON-RPC request to stdin
  mcp.stdin.write(JSON.stringify(req.body) + '\n');
  mcp.stdin.end();
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`HTTP wrapper for MCP server listening on http://0.0.0.0:${PORT}`);
  console.log(`Send POST requests with JSON-RPC payloads to http://localhost:${PORT}/`);
});

