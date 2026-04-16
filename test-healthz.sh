#!/bin/bash
# Test the healthz RPC endpoint

set -e

echo "Testing healthz RPC endpoint..."
echo ""

# Test healthz tool
echo "Sending healthz request..."
echo '{"jsonrpc":"2.0","id":5,"method":"tools/call","params":{"name":"healthz","arguments":{}}}' | node server.mjs 2>&1 | head -50

echo ""
echo "✅ Healthz test complete"

