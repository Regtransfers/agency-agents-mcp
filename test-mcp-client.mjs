#!/usr/bin/env node

/**
 * MCP Test Client - Send messages to the MCP server via stdin
 * This script helps test the Agency Agents MCP server
 */

import { createInterface } from 'readline';

// MCP JSON-RPC message ID counter
let messageId = 1;

/**
 * Send a JSON-RPC request to the MCP server
 */
function sendRequest(method, params = {}) {
  const request = {
    jsonrpc: '2.0',
    id: messageId++,
    method,
    params
  };
  
  console.error(`\n📤 Sending: ${method}`);
  console.error(JSON.stringify(params, null, 2));
  
  // Send to the MCP server on stdout (which becomes its stdin)
  console.log(JSON.stringify(request));
}

/**
 * Initialize the MCP connection
 */
function initialize() {
  sendRequest('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {
      tools: {}
    },
    clientInfo: {
      name: 'test-client',
      version: '1.0.0'
    }
  });
}

/**
 * List all available agents
 */
function listAgents(category) {
  sendRequest('tools/call', {
    name: 'list_agents',
    arguments: category ? { category } : {}
  });
}

/**
 * Search for agents by keyword
 */
function searchAgents(keyword) {
  sendRequest('tools/call', {
    name: 'search_agents',
    arguments: { keyword }
  });
}

/**
 * Activate a specific agent
 */
function activateAgent(query) {
  sendRequest('tools/call', {
    name: 'activate_agent',
    arguments: { query }
  });
}

/**
 * Get shared instructions
 */
function getSharedInstructions() {
  sendRequest('tools/call', {
    name: 'get_shared_instructions',
    arguments: {}
  });
}

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0];

console.error('🧪 MCP Test Client');
console.error('==================\n');

switch (command) {
  case 'init':
    console.error('Initializing MCP connection...');
    initialize();
    break;
    
  case 'list':
    const category = args[1];
    console.error(`Listing agents${category ? ` (category: ${category})` : ''}...`);
    listAgents(category);
    break;
    
  case 'search':
    const keyword = args[1];
    if (!keyword) {
      console.error('❌ Please provide a keyword to search for');
      console.error('Usage: node test-mcp-client.mjs search <keyword>');
      process.exit(1);
    }
    console.error(`Searching for agents with keyword: "${keyword}"...`);
    searchAgents(keyword);
    break;
    
  case 'activate':
    const query = args[1];
    if (!query) {
      console.error('❌ Please provide an agent name or query');
      console.error('Usage: node test-mcp-client.mjs activate <agent-name>');
      process.exit(1);
    }
    console.error(`Activating agent: "${query}"...`);
    activateAgent(query);
    break;
    
  case 'shared':
    console.error('Getting shared instructions...');
    getSharedInstructions();
    break;
    
  default:
    console.error('Usage: node test-mcp-client.mjs <command> [args]');
    console.error('');
    console.error('Commands:');
    console.error('  init                    - Initialize MCP connection');
    console.error('  list [category]         - List all agents (optionally filtered by category)');
    console.error('  search <keyword>        - Search agents by keyword');
    console.error('  activate <agent-name>   - Activate a specific agent');
    console.error('  shared                  - Get shared instructions');
    console.error('');
    console.error('Examples:');
    console.error('  node test-mcp-client.mjs list');
    console.error('  node test-mcp-client.mjs list engineering');
    console.error('  node test-mcp-client.mjs search security');
    console.error('  node test-mcp-client.mjs activate "backend architect"');
    console.error('  node test-mcp-client.mjs shared');
    process.exit(1);
}

// Listen for responses from the MCP server
const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

rl.on('line', (line) => {
  try {
    const response = JSON.parse(line);
    console.error('\n📥 Response received:');
    console.error(JSON.stringify(response, null, 2));
  } catch (err) {
    console.error('❌ Failed to parse response:', line);
  }
});

