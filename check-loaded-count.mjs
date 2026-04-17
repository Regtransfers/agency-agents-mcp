#!/usr/bin/env node
import { spawn } from 'child_process';

const child = spawn('node', ['server.mjs'], {
  cwd: '/home/aaron/github/agency-agents-mcp',
  stdio: ['pipe', 'pipe', 'ignore']
});

const request = JSON.stringify({
  jsonrpc: '2.0',
  id: 1,
  method: 'tools/call',
  params: { name: 'healthz', arguments: {} }
});

child.stdin.write(request + '\n');
child.stdin.end();

let output = '';
child.stdout.on('data', chunk => { output += chunk; });
child.stdout.on('end', () => {
  try {
    const response = JSON.parse(output);
    const healthData = JSON.parse(response.result.content[0].text);
    console.log('Skills loaded:', healthData.skills.total);
    console.log('Agents loaded:', healthData.agents.total);
  } catch (err) {
    console.error('Error:', err.message);
    console.error('Output:', output.substring(0, 200));
  }
});

