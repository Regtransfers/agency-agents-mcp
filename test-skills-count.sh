#!/bin/bash
cd /home/aaron/github/agency-agents-mcp
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"healthz","arguments":{}}}' | node server.mjs 2>/dev/null | jq -r '.result.content[0].text' | jq '.skills.total'

