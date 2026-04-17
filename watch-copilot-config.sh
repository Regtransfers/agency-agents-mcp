#!/bin/bash

# Auto-Fix GitHub Copilot MCP Config Watcher
# This runs in the background and automatically fixes the config when Rider overwrites it

set -e

CONFIG_FILE="$HOME/.config/JetBrains/Rider2025.3/options/github-copilot.xml"
MCP_CONFIG_PATH="$HOME/.config/github-copilot/intellij/mcp.json"
LOG_FILE="$HOME/.cache/mcp-config-watcher.log"

mkdir -p "$(dirname "$LOG_FILE")"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

fix_config() {
    # Check if mcpConfigPath is missing
    if ! grep -q "mcpConfigPath" "$CONFIG_FILE" 2>/dev/null; then
        log "⚠️  mcpConfigPath missing, fixing..."
        
        # Create temp file with fix
        TEMP_FILE=$(mktemp)
        
        # Read the current config and inject mcpConfigPath after the opening <component> tag
        if [ -f "$CONFIG_FILE" ]; then
            awk -v mcp_path="$MCP_CONFIG_PATH" '
                /<component name="github-copilot">/ {
                    print $0
                    print "    <option name=\"mcpConfigPath\" value=\"" mcp_path "\" />"
                    next
                }
                { print }
            ' "$CONFIG_FILE" > "$TEMP_FILE"
            
            # Only replace if we successfully added the line
            if grep -q "mcpConfigPath" "$TEMP_FILE"; then
                mv "$TEMP_FILE" "$CONFIG_FILE"
                log "✅ Config fixed automatically"
            else
                log "❌ Failed to inject mcpConfigPath"
                rm -f "$TEMP_FILE"
            fi
        fi
    fi
}

log "🔍 Starting MCP config watcher..."
log "📁 Watching: $CONFIG_FILE"
log "🔧 Will auto-inject: mcpConfigPath=$MCP_CONFIG_PATH"
echo ""
echo "Config watcher is running in the background..."
echo "Logs: $LOG_FILE"
echo "To stop: pkill -f watch-copilot-config"
echo ""

# Initial fix if needed
fix_config

# Watch for changes using inotifywait (install with: sudo apt install inotify-tools)
if command -v inotifywait &> /dev/null; then
    while inotifywait -e modify,close_write "$CONFIG_FILE" 2>/dev/null; do
        sleep 0.1  # Brief delay to let write complete
        fix_config
    done
else
    # Fallback to polling if inotify-tools not available
    log "⚠️  inotify-tools not found, using polling (slower)"
    log "   Install with: sudo apt install inotify-tools"
    
    LAST_HASH=""
    while true; do
        if [ -f "$CONFIG_FILE" ]; then
            CURRENT_HASH=$(md5sum "$CONFIG_FILE" | cut -d' ' -f1)
            if [ "$CURRENT_HASH" != "$LAST_HASH" ]; then
                LAST_HASH="$CURRENT_HASH"
                fix_config
            fi
        fi
        sleep 1
    done
fi

