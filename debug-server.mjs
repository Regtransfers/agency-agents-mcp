#!/usr/bin/env node
import { spawn } from 'child_process';

const child = spawn('node', ['server.mjs'], {
  cwd: '/home/aaron/github/agency-agents-mcp',
  stdio: ['pipe', 'pipe', 'pipe']
});

const request = JSON.stringify({
  jsonrpc: '2.0',
  id: 1,
  method: 'tools/call',
  params: { name: 'list_skills', arguments: {} }
});

child.stdin.write(request + '\n');
child.stdin.end();

let output = '';
let errorOutput = '';

child.stdout.on('data', chunk => { output += chunk; });
child.stderr.on('data', chunk => { errorOutput += chunk; });

child.on('close', (code) => {
  console.log('Exit code:', code);
  if (errorOutput) {
    console.log('STDERR:', errorOutput);
  }
  console.log('Output length:', output.length, 'bytes');
  
  if (output) {
    try {
      const response = JSON.parse(output);
      const text = response.result.content[0].text;
      const skillCount = (text.match(/\n- \*\*/g) || []).length;
      console.log('✅ Success!');
      console.log('Skills in response:', skillCount);
      console.log('Response text length:', text.length, 'bytes');
      console.log('\nFirst 3 skills:');
      const lines = text.split('\n').slice(2, 5);
      lines.forEach(l => console.log(l));
    } catch (err) {
      console.log('❌ Parse error:', err.message);
      console.log('Output preview:', output.substring(0, 500));
    }
  }
});
