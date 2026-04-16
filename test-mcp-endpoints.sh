#!/usr/bin/env bash

# Test the MCP server with various commands
# This script demonstrates how to interact with the MCP server

set -e

echo "🧪 Testing MCP Server Endpoints"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to test a command
test_command() {
    local description="$1"
    local command="$2"
    
    echo -e "${BLUE}Test: ${description}${NC}"
    echo "Command: $command"
    echo ""
    
    # Run the command and capture output
    echo "$command" | docker exec -i agency-agents-mcp-debug node test-mcp-client.mjs 2>&1
    
    echo ""
    echo "---"
    echo ""
}

# Check if container is running
if ! docker ps | grep -q "agency-agents-mcp-debug"; then
    echo "❌ Debug container is not running"
    echo "Start it with: docker-compose -f docker-compose.debug.yml up -d"
    exit 1
fi

echo -e "${GREEN}✅ Debug container is running${NC}"
echo ""

# Test 1: List all agents
echo -e "${YELLOW}Test 1: List All Agents${NC}"
docker exec -i agency-agents-mcp-debug sh -c 'echo "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"tools/call\",\"params\":{\"name\":\"list_agents\",\"arguments\":{}}}" | node server.mjs' 2>/dev/null | head -20

echo ""
echo "---"
echo ""

# Test 2: List engineering agents
echo -e "${YELLOW}Test 2: List Engineering Agents${NC}"
docker exec -i agency-agents-mcp-debug sh -c 'echo "{\"jsonrpc\":\"2.0\",\"id\":2,\"method\":\"tools/call\",\"params\":{\"name\":\"list_agents\",\"arguments\":{\"category\":\"engineering\"}}}" | node server.mjs' 2>/dev/null | head -20

echo ""
echo "---"
echo ""

# Test 3: Search for security agents
echo -e "${YELLOW}Test 3: Search for 'security'${NC}"
docker exec -i agency-agents-mcp-debug sh -c 'echo "{\"jsonrpc\":\"2.0\",\"id\":3,\"method\":\"tools/call\",\"params\":{\"name\":\"search_agents\",\"arguments\":{\"keyword\":\"security\"}}}" | node server.mjs' 2>/dev/null | head -20

echo ""
echo "---"
echo ""

# Test 4: Get shared instructions
echo -e "${YELLOW}Test 4: Get Shared Instructions${NC}"
docker exec -i agency-agents-mcp-debug sh -c 'echo "{\"jsonrpc\":\"2.0\",\"id\":4,\"method\":\"tools/call\",\"params\":{\"name\":\"get_shared_instructions\",\"arguments\":{}}}" | node server.mjs' 2>/dev/null | head -30

echo ""
echo "---"
echo ""

echo -e "${GREEN}✅ All tests completed!${NC}"
echo ""
echo "📝 Notes:"
echo "  - The MCP server communicates via stdin/stdout using JSON-RPC"
echo "  - Each request is a JSON object with: jsonrpc, id, method, params"
echo "  - Responses are JSON objects with: jsonrpc, id, result"
echo ""
echo "To send custom messages:"
echo "  echo '{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"tools/call\",\"params\":{\"name\":\"list_agents\",\"arguments\":{}}}' | docker exec -i agency-agents-mcp-debug node server.mjs"

