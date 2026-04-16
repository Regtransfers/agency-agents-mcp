#!/bin/bash
# Test the hosted MCP server at https://agency-agents-mcp.regtransfers.dev/

URL="https://agency-agents-mcp.regtransfers.dev"

echo "Testing MCP Server at $URL"
echo "========================================="
echo ""

echo "1. Testing healthz endpoint..."
curl -s -X POST "$URL" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"healthz","arguments":{}}}' | jq '.'

echo ""
echo "========================================="
echo ""

echo "2. Testing list_agents endpoint (first 10)..."
curl -s -X POST "$URL" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"list_agents","arguments":{}}}' | jq -r '.result.content[0].text' | head -15

echo ""
echo "========================================="
echo ""

echo "3. Testing search_agents for 'security'..."
curl -s -X POST "$URL" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"search_agents","arguments":{"keyword":"security","limit":5}}}' | jq -r '.result.content[0].text'

echo ""
echo "Done!"

