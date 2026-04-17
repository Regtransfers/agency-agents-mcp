#!/usr/bin/env node

/**
 * Test script for http-wrapper.mjs
 * Tests that JSON responses are properly captured even with large payloads
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function testStdioServer(requestData) {
  return new Promise((resolve, reject) => {
    console.log('\n=== Testing MCP stdio server ===');
    console.log('Request:', JSON.stringify(requestData));
    
    const mcp = spawn('node', [join(__dirname, 'server.mjs')], {
      stdio: ['pipe', 'pipe', 'pipe'],
      maxBuffer: 10 * 1024 * 1024
    });

    let outputChunks = [];
    let errorOutput = '';
    let stdoutEnded = false;

    const timeout = setTimeout(() => {
      mcp.kill();
      reject(new Error('Timeout'));
    }, 10000);

    mcp.stdout.on('data', (data) => {
      outputChunks.push(data);
    });

    mcp.stdout.on('end', () => {
      stdoutEnded = true;
      console.log('stdout ended, received', outputChunks.length, 'chunks');
    });

    mcp.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    mcp.on('close', (code) => {
      const processResponse = () => {
        clearTimeout(timeout);
        
        if (code !== 0) {
          reject(new Error(`Process exited with code ${code}: ${errorOutput}`));
          return;
        }

        const output = Buffer.concat(outputChunks).toString('utf8');
        console.log('Raw output length:', output.length, 'bytes');
        
        if (!output || output.trim().length === 0) {
          reject(new Error('Empty output'));
          return;
        }

        try {
          const response = JSON.parse(output);
          console.log('✅ Successfully parsed JSON response');
          resolve(response);
        } catch (err) {
          console.error('❌ Failed to parse JSON');
          console.error('Error:', err.message);
          console.error('Output preview:', output.substring(0, 500));
          reject(err);
        }
      };

      if (!stdoutEnded) {
        console.log('Process closed but stdout not ended, waiting...');
        setTimeout(processResponse, 100);
      } else {
        processResponse();
      }
    });

    mcp.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });

    mcp.stdin.write(JSON.stringify(requestData) + '\n');
    mcp.stdin.end();
  });
}

async function main() {
  try {
    // Test 1: Simple healthz request
    console.log('\n📋 Test 1: healthz (simple request)');
    const healthResult = await testStdioServer({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'healthz',
        arguments: {}
      }
    });
    console.log('Result:', JSON.stringify(healthResult).substring(0, 200));

    // Test 2: List tools (potentially large response)
    console.log('\n📋 Test 2: tools/list (large response)');
    const toolsResult = await testStdioServer({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list',
      params: {}
    });
    console.log('Number of tools:', toolsResult.result?.tools?.length || 0);

    // Test 3: List agents (can be very large)
    console.log('\n📋 Test 3: list_agents (potentially very large response)');
    const agentsResult = await testStdioServer({
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'list_agents',
        arguments: {}
      }
    });
    console.log('Result length:', JSON.stringify(agentsResult).length, 'bytes');

    console.log('\n✅ All tests passed!');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Test failed:', err.message);
    process.exit(1);
  }
}

main();

