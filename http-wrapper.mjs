#!/usr/bin/env node

/**
 * HTTP Wrapper for MCP Server
 * Maintains a persistent MCP server connection and proxies HTTP requests to stdio
 */

import express from 'express';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createInterface } from 'readline';

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

// Persistent MCP server connection
let mcpProcess = null;
let mcpReady = false;
let initializeComplete = false;
const pendingRequests = new Map();
let requestIdCounter = 1;

function startMcpServer() {
  console.log('Starting persistent MCP server...');
  
  mcpProcess = spawn('node', [join(__dirname, 'server.mjs')], {
    stdio: ['pipe', 'pipe', 'pipe']
  });

  // Set up readline for line-by-line output parsing
  const rl = createInterface({
    input: mcpProcess.stdout,
    crlfDelay: Infinity
  });

  rl.on('line', (line) => {
    try {
      const response = JSON.parse(line);
      console.log('MCP response:', JSON.stringify(response));
      
      // Handle initialization response
      if (response.id && pendingRequests.has(response.id)) {
        const { resolve, reject } = pendingRequests.get(response.id);
        pendingRequests.delete(response.id);
        
        if (response.error) {
          reject(response);
        } else {
          resolve(response);
        }
      }
    } catch (err) {
      console.error('Failed to parse MCP output:', err, 'Line:', line);
    }
  });

  mcpProcess.stderr.on('data', (data) => {
    console.error('MCP stderr:', data.toString());
  });

  mcpProcess.on('close', (code) => {
    console.error('MCP process exited with code:', code);
    mcpReady = false;
    initializeComplete = false;
    
    // Reject all pending requests
    for (const [id, { reject }] of pendingRequests) {
      reject({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'MCP server disconnected',
          data: { exitCode: code }
        },
        id
      });
    }
    pendingRequests.clear();
    
    // Restart after a delay
    setTimeout(startMcpServer, 1000);
  });

  mcpProcess.on('error', (err) => {
    console.error('MCP process error:', err);
    mcpReady = false;
    initializeComplete = false;
  });

  mcpReady = true;
  
  // Send initialize handshake
  initializeMcpServer();
}

async function initializeMcpServer() {
  if (initializeComplete) return;
  
  try {
    const initRequest = {
      jsonrpc: '2.0',
      id: requestIdCounter++,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {
          roots: { listChanged: true },
          sampling: {}
        },
        clientInfo: {
          name: 'http-wrapper',
          version: '1.0.0'
        }
      }
    };
    
    const response = await sendToMcp(initRequest);
    console.log('MCP initialized:', response);
    initializeComplete = true;
    
    // Send initialized notification
    const initializedNotification = {
      jsonrpc: '2.0',
      method: 'notifications/initialized'
    };
    mcpProcess.stdin.write(JSON.stringify(initializedNotification) + '\n');
  } catch (err) {
    console.error('Failed to initialize MCP:', err);
  }
}

function sendToMcp(request) {
  return new Promise((resolve, reject) => {
    if (!mcpReady || !mcpProcess) {
      return reject({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'MCP server not ready'
        },
        id: request.id
      });
    }
    
    // Store the pending request
    if (request.id) {
      pendingRequests.set(request.id, { resolve, reject });
      
      // Timeout after 30 seconds
      setTimeout(() => {
        if (pendingRequests.has(request.id)) {
          pendingRequests.delete(request.id);
          reject({
            jsonrpc: '2.0',
            error: {
              code: -32603,
              message: 'Request timeout'
            },
            id: request.id
          });
        }
      }, 30000);
    }
    
    // Send to MCP server
    mcpProcess.stdin.write(JSON.stringify(request) + '\n');
    
    // If no id (notification), resolve immediately
    if (!request.id) {
      resolve({ jsonrpc: '2.0', result: null });
    }
  });
}

// Health check endpoint (simple HTTP)
app.get('/health', (req, res) => {
  res.json({ 
    status: mcpReady && initializeComplete ? 'ok' : 'initializing',
    timestamp: new Date().toISOString(),
    mcpReady,
    initializeComplete
  });
});

// Root endpoint - info
app.get('/', (req, res) => {
  res.json({
    name: 'agency-agents-mcp',
    version: '1.0.0',
    description: 'HTTP wrapper for MCP stdio server (persistent connection)',
    status: {
      mcpReady,
      initializeComplete
    },
    endpoints: {
      'POST /': 'Send JSON-RPC requests to MCP server',
      'GET /health': 'Simple health check'
    },
    supportedMethods: [
      'initialize',
      'tools/list',
      'tools/call',
      'resources/list',
      'resources/read',
      'prompts/list',
      'prompts/get'
    ],
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
  
  // Wait for initialization if needed
  if (!initializeComplete && req.body.method !== 'initialize') {
    let retries = 0;
    while (!initializeComplete && retries < 50) {
      await new Promise(resolve => setTimeout(resolve, 100));
      retries++;
    }
    
    if (!initializeComplete) {
      return res.status(503).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'MCP server still initializing'
        },
        id: req.body.id || null
      });
    }
  }
  
  try {
    // Add an ID if missing
    const request = { ...req.body };
    if (!request.id && request.method !== 'notifications/initialized') {
      request.id = requestIdCounter++;
    }
    
    const response = await sendToMcp(request);
    res.json(response);
  } catch (err) {
    console.error('Error processing request:', err);
    res.status(500).json(err);
  }
});

// Start MCP server on startup
startMcpServer();

app.listen(PORT, '0.0.0.0', () => {
  console.log(`HTTP wrapper for MCP server listening on http://0.0.0.0:${PORT}`);
  console.log(`Send POST requests with JSON-RPC payloads to http://localhost:${PORT}/`);
});

