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
  
  // Spawn the MCP server process with increased buffer size
  const mcp = spawn('node', [join(__dirname, 'server.mjs')], {
    stdio: ['pipe', 'pipe', 'pipe'],
    maxBuffer: 10 * 1024 * 1024 // 10MB buffer for large responses
  });

  let outputChunks = [];
  let errorOutput = '';
  let responseSent = false;
  let stdoutEnded = false;

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

  // Capture stdout in chunks
  mcp.stdout.on('data', (data) => {
    outputChunks.push(data);
  });

  // Wait for stdout to fully end before processing
  mcp.stdout.on('end', () => {
    stdoutEnded = true;
    console.log('stdout stream ended, received', outputChunks.length, 'chunks');
  });

  // Capture stderr
  mcp.stderr.on('data', (data) => {
    errorOutput += data.toString();
    console.error('MCP stderr:', data.toString());
  });

  // Handle process completion - but wait for stdout to finish
  mcp.on('close', (code) => {
    // Give stdout a moment to finish if it hasn't yet
    const processResponse = () => {
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

      // Concatenate all chunks
      const output = Buffer.concat(outputChunks).toString('utf8');
      
      if (!output || output.trim().length === 0) {
        console.error('Empty output received from MCP server');
        return res.status(500).json({
          jsonrpc: '2.0',
          error: {
            code: -32603,
            message: 'Empty response from MCP server',
            data: { stderr: errorOutput }
          },
          id: req.body.id || null
        });
      }
      
      try {
        const response = JSON.parse(output);
        console.log('MCP response received successfully (size:', output.length, 'bytes)');
        res.json(response);
      } catch (err) {
        console.error('Failed to parse MCP response:', err);
        console.error('Raw output length:', output.length);
        console.error('Raw output preview:', output.substring(0, 500));
        res.status(500).json({
          jsonrpc: '2.0',
          error: {
            code: -32700,
            message: 'Parse error',
            data: { 
              error: err.message,
              outputLength: output.length,
              preview: output.substring(0, 200)
            }
          },
          id: req.body.id || null
        });
      }
    };

    // If stdout hasn't ended yet, wait a bit for it
    if (!stdoutEnded) {
      console.log('Process closed but stdout not ended, waiting...');
      setTimeout(processResponse, 100);
    } else {
      processResponse();
    }
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

  // Write the JSON-RPC request to stdin
  mcp.stdin.write(JSON.stringify(req.body) + '\n');
  mcp.stdin.end();
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`HTTP wrapper for MCP server listening on http://0.0.0.0:${PORT}`);
  console.log(`Send POST requests with JSON-RPC payloads to http://localhost:${PORT}/`);
});

