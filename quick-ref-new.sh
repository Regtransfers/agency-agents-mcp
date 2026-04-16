#!/bin/bash
# Quick reference commands for agency-agents-mcp

set -e

echo "🚀 Agency Agents MCP - Quick Reference"
echo "======================================"
echo ""

# Check what command was requested
case "${1:-help}" in
  
  # Build Docker images
  build)
    echo "📦 Building Docker images..."
    docker build -t agency-agents-mcp:latest .
    docker build -f Dockerfile.dev -t agency-agents-mcp:debug .
    echo "✅ Build complete"
    ;;
  
  # Start production container
  start)
    echo "▶️  Starting production container..."
    docker-compose up -d
    echo "✅ Container started"
    docker-compose ps
    ;;
  
  # Start debug container
  debug)
    echo "🐛 Starting debug container..."
    docker-compose -f docker-compose.debug.yml up -d
    echo "✅ Debug container started (debugger on port 9229)"
    docker-compose -f docker-compose.debug.yml ps
    ;;
  
  # Stop containers
  stop)
    echo "⏹️  Stopping containers..."
    docker-compose down 2>/dev/null || true
    docker-compose -f docker-compose.debug.yml down 2>/dev/null || true
    echo "✅ Containers stopped"
    ;;
  
  # View logs
  logs)
    echo "📋 Container logs..."
    docker-compose logs -f --tail=50
    ;;
  
  # Test healthz endpoint
  health)
    echo "🏥 Testing healthz endpoint..."
    echo '{"jsonrpc":"2.0","id":5,"method":"tools/call","params":{"name":"healthz","arguments":{}}}' | \
      docker exec -i agency-agents-mcp-debug node server.mjs 2>&1 | \
      grep -q '"status":"healthy"' && \
      echo "✅ Server is HEALTHY" || \
      echo "❌ Server is UNHEALTHY"
    ;;
  
  # Test MCP tools
  test)
    echo "🧪 Testing MCP tools..."
    ./test-mcp-endpoints.sh
    ;;
  
  # Run healthz test
  test-health)
    echo "🧪 Testing healthz endpoint..."
    ./test-healthz.sh
    ;;
  
  # Check syntax
  check)
    echo "✔️  Checking server.mjs syntax..."
    node --check server.mjs && echo "✅ No syntax errors" || echo "❌ Syntax errors found"
    ;;
  
  # List agents locally
  agents)
    echo "📚 Listing all agents..."
    ls -1 agents/*.md | wc -l | xargs echo "Total agents:"
    echo ""
    ls -1 agents/*.md | head -20
    echo "... (showing first 20)"
    ;;
  
  # Push to Azure Container Registry
  push)
    echo "☁️  Pushing to Azure Container Registry..."
    docker tag agency-agents-mcp:latest bluemountain.azurecr.io/agency-agents-mcp:latest
    docker tag agency-agents-mcp:latest bluemountain.azurecr.io/agency-agents-mcp:$(git rev-parse --short HEAD)
    docker push bluemountain.azurecr.io/agency-agents-mcp:latest
    docker push bluemountain.azurecr.io/agency-agents-mcp:$(git rev-parse --short HEAD)
    echo "✅ Pushed to registry"
    ;;
  
  # Deploy to Kubernetes
  k8s)
    echo "☸️  Deploying to Kubernetes..."
    kubectl apply -f k8s-example.yaml
    echo "✅ Deployed"
    kubectl get pods -l app=agency-agents-mcp
    ;;
  
  # Show Kubernetes pod status
  k8s-status)
    echo "☸️  Kubernetes pod status..."
    kubectl describe pod -l app=agency-agents-mcp
    ;;
  
  # Show status of everything
  status)
    echo "📊 System Status"
    echo "==============="
    echo ""
    echo "🐳 Docker Containers:"
    docker ps -a | grep agency-agents-mcp || echo "  No containers running"
    echo ""
    echo "📦 Docker Images:"
    docker images | grep agency-agents-mcp || echo "  No images built"
    echo ""
    echo "📚 Agents:"
    ls -1 agents/*.md | wc -l | xargs echo "  Total:"
    echo ""
    echo "📋 Shared Instructions:"
    ls -1 shared-instructions/*.md | wc -l | xargs echo "  Total files:"
    ;;
  
  # Clean everything
  clean)
    echo "🧹 Cleaning up..."
    docker-compose down 2>/dev/null || true
    docker-compose -f docker-compose.debug.yml down 2>/dev/null || true
    docker rmi agency-agents-mcp:latest 2>/dev/null || true
    docker rmi agency-agents-mcp:debug 2>/dev/null || true
    echo "✅ Cleanup complete"
    ;;
  
  # Show help
  help|*)
    echo "Available commands:"
    echo ""
    echo "  build         - Build Docker images (production + debug)"
    echo "  start         - Start production container"
    echo "  debug         - Start debug container (with inspector on port 9229)"
    echo "  stop          - Stop all containers"
    echo "  logs          - View container logs"
    echo "  health        - Test healthz endpoint"
    echo "  test          - Run MCP endpoint tests"
    echo "  test-health   - Run healthz-specific tests"
    echo "  check         - Check server.mjs syntax"
    echo "  agents        - List all agent files"
    echo "  push          - Push images to Azure Container Registry"
    echo "  k8s           - Deploy to Kubernetes"
    echo "  k8s-status    - Show Kubernetes pod status"
    echo "  status        - Show status of everything"
    echo "  clean         - Stop containers and remove images"
    echo "  help          - Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./quick-ref.sh build      # Build images"
    echo "  ./quick-ref.sh debug      # Start with debugger"
    echo "  ./quick-ref.sh health     # Check health"
    echo "  ./quick-ref.sh status     # Show everything"
    ;;
esac

