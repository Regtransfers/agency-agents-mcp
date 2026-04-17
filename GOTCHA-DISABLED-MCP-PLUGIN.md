# 🔴 GOTCHA: Disabled MCP Plugin in JetBrains Rider

**Date:** April 17, 2026  
**Severity:** CRITICAL - Breaks all MCP functionality  
**Affected Versions:** Rider 2025.3+, Rider 2026.1+

---

## The Problem

JetBrains Rider can disable plugins via the `disabled_plugins.txt` file. If the MCP plugin (`com.intellij.mcpServer`) is listed in this file, **MCP will NOT work at all**, regardless of how perfect your configuration files are.

This is an **invisible failure mode** that's extremely frustrating to debug because:
- All your config files can be 100% correct
- Manual tests of the MCP server work perfectly
- Rider logs show NO errors - they just don't mention MCP at all
- GitHub Copilot itself works fine, but MCP tools never appear

---

## Symptoms

If you're experiencing this issue, you'll see:

✅ **What works:**
- GitHub Copilot Chat works normally
- Manual wrapper script tests return correct JSON responses
- Config files are properly formatted and in the correct locations
- File permissions are correct

❌ **What doesn't work:**
- MCP tools never appear in Copilot Chat
- No "MCP Extension Service" messages in Rider logs
- No MCP-related activity in `idea.log`
- No `mcp/agency-agents.log` file created

---

## How to Check

### Quick Check
```bash
# For Rider 2025.3
cat ~/.config/JetBrains/Rider2025.3/disabled_plugins.txt 2>/dev/null | grep mcpServer

# For Rider 2026.1
cat ~/.config/JetBrains/Rider2026.1/disabled_plugins.txt 2>/dev/null | grep mcpServer
```

**If you see `com.intellij.mcpServer` in the output:** The MCP plugin is DISABLED!

### Detailed Verification
```bash
# Check the full disabled plugins list
cat ~/.config/JetBrains/Rider*/disabled_plugins.txt

# Check if MCP Extension Service ever started
grep "MCP Extension Service" ~/.cache/JetBrains/Rider*/log/idea.log

# Check if MCP plugin is in loaded plugins list
grep "com.intellij.mcpServer" ~/.cache/JetBrains/Rider*/log/idea.log
```

---

## The Fix

### Option 1: Delete the Entire File (Safest)
If you don't have other plugins you intentionally disabled:

```bash
rm ~/.config/JetBrains/Rider*/disabled_plugins.txt
```

### Option 2: Remove Only the MCP Plugin Entry
If you have other disabled plugins you want to keep:

1. Edit the file:
   ```bash
   nano ~/.config/JetBrains/Rider2026.1/disabled_plugins.txt
   # or
   code ~/.config/JetBrains/Rider2026.1/disabled_plugins.txt
   ```

2. Remove the line containing `com.intellij.mcpServer`

3. Save and close

### Step 2: Restart Rider COMPLETELY

This is **CRITICAL**:
- Close ALL Rider windows
- Wait 10 seconds (ensure all processes have stopped)
- Reopen Rider

### Step 3: Verify It's Fixed

```bash
# Check the logs for successful MCP startup
grep "MCP Extension Service started successfully" ~/.cache/JetBrains/Rider*/log/idea.log
```

**Expected output:**
```
2026-04-17 02:30:55,567 [  11882]   INFO - #com.github.copilot.mcp.extension.McpExtensionService - MCP Extension Service started successfully
```

If you see that message: ✅ **SUCCESS!** The MCP plugin is now enabled and loaded.

### Step 4: Test in Copilot Chat

Open GitHub Copilot Chat and ask:
```
List available agents
```

You should now see all 144+ agent personas!

---

## Why This Happens

### Common Scenarios:

1. **Manual Plugin Disabling:**
   - You or someone else disabled the plugin through Rider's Settings → Plugins

2. **Plugin Crashes:**
   - The plugin crashed during startup, and Rider automatically disabled it

3. **IDE Migration:**
   - Settings were copied from another Rider version that had the plugin disabled

4. **IDE Reset:**
   - IDE settings were reset, and the disabled plugins list was created automatically

---

## Prevention

### Check Plugin Status Regularly
```bash
# Add to your shell profile (e.g., .zshrc or .bashrc)
alias check-mcp-rider="grep -l mcpServer ~/.config/JetBrains/Rider*/disabled_plugins.txt 2>/dev/null && echo '⚠️  MCP plugin is DISABLED!' || echo '✅ MCP plugin status: OK'"
```

Then run `check-mcp-rider` anytime you suspect issues.

### Monitor MCP Startup
```bash
# Create a quick check script
cat > ~/bin/mcp-rider-status.sh << 'EOF'
#!/bin/bash
echo "=== MCP Plugin Status ==="
if grep -q mcpServer ~/.config/JetBrains/Rider*/disabled_plugins.txt 2>/dev/null; then
    echo "❌ MCP plugin is DISABLED in disabled_plugins.txt"
else
    echo "✅ MCP plugin not in disabled list"
fi

echo ""
echo "=== MCP Extension Service Status ==="
if grep -q "MCP Extension Service started successfully" ~/.cache/JetBrains/Rider*/log/idea.log; then
    echo "✅ MCP Extension Service started successfully"
    grep "MCP Extension Service" ~/.cache/JetBrains/Rider*/log/idea.log | tail -1
else
    echo "❌ MCP Extension Service NOT found in logs"
fi
EOF
chmod +x ~/bin/mcp-rider-status.sh
```

---

## Related Issues

This gotcha is now documented in:
- ✅ [README.md](README.md) - Quick Fixes table
- ✅ [README.md](README.md) - Common Gotchas section
- ✅ [README.md](README.md) - Troubleshooting Step 1
- ✅ [TROUBLESHOOTING-GUIDE.md](TROUBLESHOOTING-GUIDE.md) - Issue #0 (most critical)
- ✅ [TROUBLESHOOTING-GUIDE.md](TROUBLESHOOTING-GUIDE.md) - Diagnostic report
- ✅ [TROUBLESHOOTING-GUIDE.md](TROUBLESHOOTING-GUIDE.md) - FAQ
- ✅ [MCP-FULLY-WORKING.md](MCP-FULLY-WORKING.md) - Complete success story

---

## Bottom Line

**Before spending hours debugging MCP configuration:**

1. ✅ Check `disabled_plugins.txt` for `com.intellij.mcpServer`
2. ✅ Check logs for "MCP Extension Service started successfully"
3. ✅ If the plugin is disabled, remove it and restart Rider

**This single check can save you hours of frustration!**

---

**Related Documentation:**
- [README.md](README.md) - Full installation and setup guide
- [TROUBLESHOOTING-GUIDE.md](TROUBLESHOOTING-GUIDE.md) - Complete troubleshooting reference
- [MCP-FULLY-WORKING.md](MCP-FULLY-WORKING.md) - Working configuration example

