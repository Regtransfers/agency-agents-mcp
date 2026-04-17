#!/bin/bash

# Fix GitHub Copilot MCP Config for Rider 2025.3
# Run this script when Rider is CLOSED to add the mcpConfigPath option

set -e

CONFIG_FILE="$HOME/.config/JetBrains/Rider2025.3/options/github-copilot.xml"
MCP_CONFIG_PATH="$HOME/.config/github-copilot/intellij/mcp.json"

echo "🔧 Fixing GitHub Copilot MCP Configuration..."
echo ""

# Check if Rider is running
if pgrep -f "jetbrains.*rider" > /dev/null 2>&1; then
    echo "❌ ERROR: Rider is currently running!"
    echo "   Please close Rider completely before running this script."
    echo "   Rider will overwrite the config if it's open."
    exit 1
fi

echo "✅ Rider is closed, safe to proceed"
echo ""

# Backup existing config
if [ -f "$CONFIG_FILE" ]; then
    cp "$CONFIG_FILE" "$CONFIG_FILE.backup"
    echo "📦 Backed up existing config to: $CONFIG_FILE.backup"
fi

# Write the corrected config
cat > "$CONFIG_FILE" << 'EOF'
<application>
  <component name="github-copilot">
    <option name="mcpConfigPath" value="$MCP_CONFIG_PATH_PLACEHOLDER" />
    <option name="signinNotificationShown" value="true" />
    <option name="terminalRulesVersion" value="1" />
    <mcpSamplingAllowedModels>
      <option value="claude-sonnet-4.5" />
      <option value="gpt-4.1" />
      <option value="gpt-5.4" />
      <option value="gpt-5.4-mini" />
    </mcpSamplingAllowedModels>
  </component>
</application>
EOF

# Replace placeholder with actual path
sed -i "s|\$MCP_CONFIG_PATH_PLACEHOLDER|$MCP_CONFIG_PATH|g" "$CONFIG_FILE"

echo "✅ Updated: $CONFIG_FILE"
echo ""

# Verify the change
if grep -q "mcpConfigPath" "$CONFIG_FILE"; then
    echo "✅ VERIFIED: mcpConfigPath is present in config"
    echo ""
    echo "📄 Current config:"
    cat "$CONFIG_FILE"
    echo ""
    echo "✨ SUCCESS! Configuration updated."
    echo ""
    echo "Next steps:"
    echo "  1. Start Rider"
    echo "  2. Open a NEW Copilot chat (click + button)"
    echo "  3. Ask: 'list available agents'"
    echo "  4. You should see 144+ agent personas available"
else
    echo "❌ ERROR: mcpConfigPath not found in config!"
    echo "   Restoring backup..."
    if [ -f "$CONFIG_FILE.backup" ]; then
        mv "$CONFIG_FILE.backup" "$CONFIG_FILE"
        echo "   Backup restored."
    fi
    exit 1
fi

