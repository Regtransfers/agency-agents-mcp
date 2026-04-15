# -------------------------------------------------------------------
# Uninstaller — removes agents, MCP server, and Copilot MCP config
# (Windows PowerShell)
# -------------------------------------------------------------------
$ErrorActionPreference = "Stop"

$AgentsDir = Join-Path $env:USERPROFILE ".github\agents"
$ServerDir = Join-Path $env:USERPROFILE ".github\mcp-servers\agency-agents"
$SharedInstructionsDir = Join-Path $env:USERPROFILE ".github\shared-instructions"

function Info($msg)  { Write-Host "[INFO]  $msg" -ForegroundColor Green }
function Warn($msg)  { Write-Host "[WARN]  $msg" -ForegroundColor Yellow }

Write-Host ""
Write-Host "This will remove:"
Write-Host "  - Agent definitions:      $AgentsDir"
Write-Host "  - Shared instructions:    $SharedInstructionsDir"
Write-Host "  - MCP server:             $ServerDir"
Write-Host "  - agency-agents entry from Copilot MCP configs"
Write-Host ""
$answer = Read-Host "Continue? [y/N]"
if ($answer -ne "y" -and $answer -ne "Y") {
    Write-Host "Aborted."
    exit 0
}

# Remove agents
if (Test-Path $AgentsDir) {
    Remove-Item $AgentsDir -Recurse -Force
    Info "Removed $AgentsDir"
} else {
    Info "No agents directory found."
}

# Remove shared instructions
if (Test-Path $SharedInstructionsDir) {
    Remove-Item $SharedInstructionsDir -Recurse -Force
    Info "Removed $SharedInstructionsDir"
} else {
    Info "No shared instructions directory found."
}

# Remove server
if (Test-Path $ServerDir) {
    Remove-Item $ServerDir -Recurse -Force
    Info "Removed $ServerDir"
} else {
    Info "No MCP server directory found."
}

# Clean up empty parent dir
$mcpServersDir = Join-Path $env:USERPROFILE ".github\mcp-servers"
if ((Test-Path $mcpServersDir) -and ((Get-ChildItem $mcpServersDir).Count -eq 0)) {
    Remove-Item $mcpServersDir -Force
}

# Note about MCP configs
$configPaths = @(
    (Join-Path $env:APPDATA "github-copilot\intellij\mcp.json"),
    (Join-Path $env:APPDATA "github-copilot\vscode\mcp.json")
)

foreach ($config in $configPaths) {
    if ((Test-Path $config) -and (Select-String -Path $config -Pattern "agency-agents" -Quiet)) {
        Warn "MCP config at $config still references agency-agents."
        Warn "Edit it manually to remove the 'agency-agents' server block, or delete the file if it was the only entry."
    }
}

Write-Host ""
Info "Uninstall complete. Restart your IDE to apply."



