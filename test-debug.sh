#!/usr/bin/env bash

# Quick test script for Docker debug setup

set -e

echo "🐳 Testing Docker Debug Setup for Agency Agents MCP"
echo "=================================================="
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi
echo "✅ Docker is running"

# Build the debug image
echo ""
echo "📦 Building debug image..."
docker build -f Dockerfile.dev -t agency-agents-mcp:debug . > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Debug image built successfully"
else
    echo "❌ Failed to build debug image"
    exit 1
fi

# Start the debug container
echo ""
echo "🚀 Starting debug container..."
docker-compose -f docker-compose.debug.yml up -d > /dev/null 2>&1
sleep 3  # Give it time to start

# Check if container is running
if docker ps | grep -q "agency-agents-mcp-debug"; then
    echo "✅ Debug container is running"
else
    echo "❌ Debug container failed to start"
    docker-compose -f docker-compose.debug.yml logs
    exit 1
fi

# Check if debugger is listening
echo ""
echo "🔍 Checking debugger..."
if docker-compose -f docker-compose.debug.yml logs 2>/dev/null | grep -q "Debugger listening"; then
    echo "✅ Debugger is listening on port 9229"
    DEBUG_URL=$(docker-compose -f docker-compose.debug.yml logs 2>/dev/null | grep "Debugger listening" | tail -1)
    echo "   $DEBUG_URL"
else
    echo "❌ Debugger not listening"
    docker-compose -f docker-compose.debug.yml logs
    exit 1
fi

# Check if port is exposed
echo ""
echo "🔌 Checking port exposure..."
if docker port agency-agents-mcp-debug 9229 > /dev/null 2>&1; then
    PORT_INFO=$(docker port agency-agents-mcp-debug 9229)
    echo "✅ Port 9229 is exposed: $PORT_INFO"
else
    echo "❌ Port 9229 is not exposed"
    exit 1
fi

# Check if agents are loaded
echo ""
echo "📚 Checking agents..."
AGENT_COUNT=$(docker exec agency-agents-mcp-debug sh -c "ls /app/agents/*.md 2>/dev/null | wc -l" || echo "0")
if [ "$AGENT_COUNT" -gt 0 ]; then
    echo "✅ Found $AGENT_COUNT agent files"
else
    echo "❌ No agent files found"
    exit 1
fi

# Check if shared instructions exist
SHARED_COUNT=$(docker exec agency-agents-mcp-debug sh -c "ls /app/shared-instructions/*.md 2>/dev/null | wc -l" || echo "0")
if [ "$SHARED_COUNT" -gt 0 ]; then
    echo "✅ Found $SHARED_COUNT shared instruction files"
else
    echo "⚠️  No shared instruction files found"
fi

echo ""
echo "=================================================="
echo "✨ All tests passed! Debug environment is ready."
echo ""
echo "Next steps:"
echo "1. Open VS Code or JetBrains IDE"
echo "2. Set breakpoints in server.mjs"
echo "3. Select 'Docker: Debug MCP Server' configuration"
echo "4. Start debugging (F5 in VS Code, Shift+F9 in Rider)"
echo ""
echo "To view logs:"
echo "  docker-compose -f docker-compose.debug.yml logs -f"
echo ""
echo "To stop:"
echo "  docker-compose -f docker-compose.debug.yml down"
echo ""

