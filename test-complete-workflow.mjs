#!/usr/bin/env node
/**
 * Complete workflow test:
 * 1. List skills (minimal data)
 * 2. Search for a skill
 * 3. Activate/load a specific skill (full details)
 * 4. List agents
 * 5. Activate an agent + skill combo
 */

import { spawn } from 'child_process';

function callMCP(method, params) {
  return new Promise((resolve, reject) => {
    const child = spawn('node', ['server.mjs'], {
      cwd: '/home/aaron/github/agency-agents-mcp',
      stdio: ['pipe', 'pipe', 'pipe']
    });

    const request = JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method,
      params
    });

    let output = '';
    let errorOutput = '';

    child.stdout.on('data', chunk => { output += chunk; });
    child.stderr.on('data', chunk => { errorOutput += chunk; });

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Exit code ${code}: ${errorOutput}`));
        return;
      }

      try {
        const response = JSON.parse(output);
        resolve(response);
      } catch (err) {
        reject(new Error(`Parse error: ${err.message}\nOutput: ${output.substring(0, 200)}`));
      }
    });

    child.stdin.write(request + '\n');
    child.stdin.end();
  });
}

async function test() {
  console.log('='.repeat(80));
  console.log('COMPLETE WORKFLOW TEST');
  console.log('='.repeat(80));

  // Test 1: List skills (should be fast, minimal data)
  console.log('\n📋 TEST 1: List skills (security category only)');
  console.log('-'.repeat(80));
  const startList = Date.now();
  const listResult = await callMCP('tools/call', {
    name: 'list_skills',
    arguments: { category: 'security' }
  });
  const listDuration = Date.now() - startList;
  
  const listText = listResult.result.content[0].text;
  const skillCount = (listText.match(/\n- \*\*/g) || []).length;
  console.log(`✅ Listed ${skillCount} security skills`);
  console.log(`   Duration: ${listDuration}ms`);
  console.log(`   Response size: ${listText.length} bytes`);
  console.log('\nFirst 3 skills:');
  listText.split('\n').slice(2, 5).forEach(line => console.log('  ' + line));

  // Test 2: Search for a specific skill
  console.log('\n\n🔍 TEST 2: Search for "security audit" skills');
  console.log('-'.repeat(80));
  const startSearch = Date.now();
  const searchResult = await callMCP('tools/call', {
    name: 'search_skills',
    arguments: { keyword: 'security audit', limit: 5 }
  });
  const searchDuration = Date.now() - startSearch;
  
  const searchText = searchResult.result.content[0].text;
  console.log(`✅ Search completed in ${searchDuration}ms`);
  console.log('\nResults:');
  searchText.split('\n').slice(2, 7).forEach(line => console.log('  ' + line));

  // Test 3: Activate a specific skill (full details)
  console.log('\n\n⚡ TEST 3: Activate skill "007" (full details)');
  console.log('-'.repeat(80));
  const startActivate = Date.now();
  const activateResult = await callMCP('tools/call', {
    name: 'activate_skill',
    arguments: { query: '007' }
  });
  const activateDuration = Date.now() - startActivate;
  
  const activateText = activateResult.result.content[0].text;
  console.log(`✅ Skill activated in ${activateDuration}ms`);
  console.log(`   Full content size: ${activateText.length} bytes`);
  console.log('\nSkill header:');
  activateText.split('\n').slice(0, 10).forEach(line => console.log('  ' + line));
  console.log('  ...(full skill body loaded)...');

  // Test 4: List agents
  console.log('\n\n👥 TEST 4: List agents (engineering category)');
  console.log('-'.repeat(80));
  const startAgents = Date.now();
  const agentsResult = await callMCP('tools/call', {
    name: 'list_agents',
    arguments: { category: 'engineering' }
  });
  const agentsDuration = Date.now() - startAgents;
  
  const agentsText = agentsResult.result.content[0].text;
  const agentCount = (agentsText.match(/\n- \*\*/g) || []).length;
  console.log(`✅ Listed ${agentCount} engineering agents in ${agentsDuration}ms`);
  console.log('\nFirst 3 agents:');
  agentsText.split('\n').slice(2, 5).forEach(line => console.log('  ' + line));

  // Test 5: Activate an agent
  console.log('\n\n🎭 TEST 5: Activate "security-engineer" agent');
  console.log('-'.repeat(80));
  const startAgentActivate = Date.now();
  const agentActivateResult = await callMCP('tools/call', {
    name: 'activate_agent',
    arguments: { query: 'security-engineer' }
  });
  const agentActivateDuration = Date.now() - startAgentActivate;
  
  const agentText = agentActivateResult.result.content[0].text;
  console.log(`✅ Agent activated in ${agentActivateDuration}ms`);
  console.log(`   Full content size: ${agentText.length} bytes`);
  console.log('\nAgent header:');
  agentText.split('\n').slice(0, 8).forEach(line => console.log('  ' + line));

  // Summary
  console.log('\n\n' + '='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  console.log(`✅ List skills (security):     ${listDuration}ms - ${skillCount} skills, ${listText.length} bytes`);
  console.log(`✅ Search skills:               ${searchDuration}ms`);
  console.log(`✅ Activate skill (007):        ${activateDuration}ms - ${activateText.length} bytes`);
  console.log(`✅ List agents (engineering):   ${agentsDuration}ms - ${agentCount} agents`);
  console.log(`✅ Activate agent (security):   ${agentActivateDuration}ms - ${agentText.length} bytes`);
  
  console.log('\n💡 WORKFLOW EXPLANATION:');
  console.log('  1. List skills returns minimal data (name, id, category only)');
  console.log('  2. Search helps find specific skills');
  console.log('  3. Activate loads FULL skill body (instructions, examples, etc)');
  console.log('  4. List agents shows available personas');
  console.log('  5. Activate agent loads full agent persona');
  console.log('  6. Combine: "Activate security-engineer agent + use 007 skill"');
  
  console.log('\n✅ ALL TESTS PASSED!');
  console.log('='.repeat(80));
}

test().catch(err => {
  console.error('\n❌ TEST FAILED:', err.message);
  process.exit(1);
});

