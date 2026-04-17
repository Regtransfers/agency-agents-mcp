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
app.post('/', async (req, res) => {
  console.log('Received JSON-RPC request:', JSON.stringify(req.body));
  
  // Spawn the MCP server process with increased buffer size
  const mcp = spawn('node', [join(__dirname, 'server.mjs')], {
    stdio: ['pipe', 'pipe', 'pipe'],
    maxBuffer: 10 * 1024 * 1024 // 10MB buffer for large responses
  });

  let outputBuffer = '';
  let errorOutput = '';
  let responseSent = false;
  let responses = [];

  // Set a timeout for the request (30 seconds)
  const timeout = setTimeout(() => {
    if (!responseSent) {
      responseSent = true;
      console.error('MCP process timeout');
      mcp.kill();
      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Request timeout',
          data: { timeout: '30s' }
        },
        id: req.body.id || null
      });
    }
  }, 30000);

  // Capture stdout line by line (MCP sends one JSON per line)
  mcp.stdout.on('data', (data) => {
    outputBuffer += data.toString();
    
    // Process complete lines
    const lines = outputBuffer.split('\n');
    outputBuffer = lines.pop(); // Keep incomplete line in buffer
    
    for (const line of lines) {
      if (line.trim()) {
        try {
          const msg = JSON.parse(line);
          responses.push(msg);
        } catch (err) {
          console.error('Failed to parse line:', line);
        }
      }
    }
  });

  // Capture stderr
  mcp.stderr.on('data', (data) => {
    errorOutput += data.toString();
    console.error('MCP stderr:', data.toString());
  });

  // Handle process completion
  mcp.on('close', (code) => {
    clearTimeout(timeout);
    
    if (responseSent) {
      return; // Already handled by timeout
    }
    
    responseSent = true;

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

    if (responses.length === 0) {
      console.error('No responses received from MCP server');
      console.error('Stderr:', errorOutput);
      return res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'No response from MCP server',
          data: { stderr: errorOutput }
        },
        id: req.body.id || null
      });
    }

    // Return the last response (the one matching our request ID)
    const targetResponse = responses.find(r => r.id === req.body.id) || responses[responses.length - 1];
    console.log('MCP response received successfully');
    res.json(targetResponse);
  });

  // Handle spawn errors
  mcp.on('error', (err) => {
    clearTimeout(timeout);
    
    if (!responseSent) {
      responseSent = true;
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
    }
  });

  // MCP protocol sequence:
  // 1. Send initialize
  // 2. Wait for response
  // 3. Send initialized notification
  // 4. Send the actual request
  
  // Step 1: Initialize
  mcp.stdin.write(JSON.stringify({
    jsonrpc: '2.0',
    id: 0,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'http-wrapper',
        version: '1.0.0'
      }
    }
  }) + '\n');

  // Step 2: Send initialized notification
  mcp.stdin.write(JSON.stringify({
    jsonrpc: '2.0',
    method: 'notifications/initialized'
  }) + '\n');

  // Step 3: Send the actual request
  mcp.stdin.write(JSON.stringify(req.body) + '\n');
  mcp.stdin.end();
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`HTTP wrapper for MCP server listening on http://0.0.0.0:${PORT}`);
  console.log(`Send POST requests with JSON-RPC payloads to http://localhost:${PORT}/`);
});

