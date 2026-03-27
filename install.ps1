# -------------------------------------------------------------------
# Agency Agents MCP — Automated Installer (Windows PowerShell)
#
# Run this from the cloned repo root:
#   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
#   .\install.ps1
#
# What it does:
#   1. Checks prerequisites (Node >= 18, npm, git)
#   2. Downloads agent persona Markdown files from the upstream repo
#   3. Installs the MCP server and its dependencies
#   4. Writes the Copilot MCP config for your IDE (Rider, VS Code, or both)
#   5. Prints next steps
# -------------------------------------------------------------------
$ErrorActionPreference = "Stop"

$AgentsDir = Join-Path $env:USERPROFILE ".github\agents"
$ServerDir = Join-Path $env:USERPROFILE ".github\mcp-servers\agency-agents"
$AgentsRepo = "https://github.com/msitarzewski/agency-agents.git"

# ── Helpers ──────────────────────────────────────────────────────────
function Info($msg)  { Write-Host "[INFO]  $msg" -ForegroundColor Green }
function Warn($msg)  { Write-Host "[WARN]  $msg" -ForegroundColor Yellow }
function Fail($msg)  { Write-Host "[ERROR] $msg" -ForegroundColor Red; exit 1 }

function Test-Command($cmd) {
    if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
        Fail "'$cmd' is required but not installed. Install it and re-run."
    }
}

# ── Prerequisites ────────────────────────────────────────────────────
Info "Checking prerequisites..."

Test-Command "node"
Test-Command "npm"
Test-Command "git"

$nodeVersion = (node -v) -replace '^v', ''
$nodeMajor = [int]($nodeVersion -split '\.')[0]
if ($nodeMajor -lt 18) {
    Fail "Node.js >= 18 is required. Found v$nodeVersion."
}
Info "Node.js v$nodeVersion — OK"

# ── Step 1: Download agent definitions ───────────────────────────────
$existingAgents = @()
if (Test-Path $AgentsDir) {
    $existingAgents = Get-ChildItem -Path $AgentsDir -Filter "*.md" -ErrorAction SilentlyContinue
}

if ($existingAgents.Count -gt 0) {
    Info "Agent definitions directory already exists with $($existingAgents.Count) agents."
    $answer = Read-Host "    Overwrite with latest from upstream? [y/N]"
    if ($answer -ne "y" -and $answer -ne "Y") {
        Info "Keeping existing agents."
    } else {
        Info "Updating agents from $AgentsRepo ..."
        $tmpDir = Join-Path ([System.IO.Path]::GetTempPath()) ("agency-agents-" + [guid]::NewGuid().ToString("N").Substring(0,8))
        $gitOutput = git clone --quiet --depth 1 $AgentsRepo $tmpDir 2>&1
        if ($LASTEXITCODE -ne 0) { Fail "git clone failed: $gitOutput" }
        Get-ChildItem -Path $tmpDir -Filter "*.md" -Recurse |
            Where-Object { $_.DirectoryName -ne $tmpDir } |
            Copy-Item -Destination $AgentsDir -Force
        Remove-Item $tmpDir -Recurse -Force
        $count = (Get-ChildItem -Path $AgentsDir -Filter "*.md").Count
        Info "$count agents installed."
    }
} else {
    Info "Downloading agent definitions from $AgentsRepo ..."
    New-Item -ItemType Directory -Path $AgentsDir -Force | Out-Null
    $tmpDir = Join-Path ([System.IO.Path]::GetTempPath()) ("agency-agents-" + [guid]::NewGuid().ToString("N").Substring(0,8))
    $gitOutput = git clone --quiet --depth 1 $AgentsRepo $tmpDir 2>&1
    if ($LASTEXITCODE -ne 0) { Fail "git clone failed: $gitOutput" }
    Get-ChildItem -Path $tmpDir -Filter "*.md" -Recurse |
        Where-Object { $_.DirectoryName -ne $tmpDir } |
        Copy-Item -Destination $AgentsDir -Force
    Remove-Item $tmpDir -Recurse -Force
    $count = (Get-ChildItem -Path $AgentsDir -Filter "*.md").Count
    Info "$count agents installed to $AgentsDir"
}

# ── Step 2: Install MCP server ───────────────────────────────────────
Info "Installing MCP server to $ServerDir ..."
New-Item -ItemType Directory -Path $ServerDir -Force | Out-Null

$scriptDir = $PSScriptRoot

Copy-Item (Join-Path $scriptDir "server.mjs")   -Destination (Join-Path $ServerDir "server.mjs")   -Force
Copy-Item (Join-Path $scriptDir "package.json") -Destination (Join-Path $ServerDir "package.json") -Force

Push-Location $ServerDir
npm install --production --silent 2>&1 | Out-Null
Pop-Location
Info "MCP server installed."

# ── Step 3: Verify server starts ─────────────────────────────────────
Info "Verifying server starts..."
$tmpOut = [System.IO.Path]::GetTempFileName()
$tmpErr = [System.IO.Path]::GetTempFileName()
$serverProc = Start-Process -FilePath "node" -ArgumentList (Join-Path $ServerDir "server.mjs") `
    -NoNewWindow -PassThru -RedirectStandardOutput $tmpOut -RedirectStandardError $tmpErr
Start-Sleep -Seconds 2
if (-not $serverProc.HasExited) {
    $serverProc.Kill()
}
Remove-Item $tmpOut, $tmpErr -Force -ErrorAction SilentlyContinue
Info "Server binary OK."

# ── Step 4: Write Copilot MCP config ─────────────────────────────────
function Write-McpConfig {
    param([string]$ConfigDir, [string]$IdeName)

    $configFile = Join-Path $ConfigDir "mcp.json"

    # Use forward slashes in JSON paths for cross-platform compat
    $serverPath = (Join-Path $ServerDir "server.mjs") -replace '\\', '/'
    $agentsPath = $AgentsDir -replace '\\', '/'

    $config = @"
{
    "servers": {
        "agency-agents": {
            "type": "stdio",
            "command": "node",
            "args": ["$serverPath"],
            "env": {
                "AGENTS_DIR": "$agentsPath"
            }
        }
    }
}
"@

    if (-not (Test-Path $ConfigDir)) {
        New-Item -ItemType Directory -Path $ConfigDir -Force | Out-Null
    }

    if (Test-Path $configFile) {
        $existing = Get-Content $configFile -Raw
        if ($existing -match "agency-agents") {
            Info "$IdeName config already contains agency-agents — skipping."
            return
        } else {
            Warn "$IdeName config exists at $configFile but does not contain agency-agents."
            Warn "You will need to manually merge the following into your existing config:"
            Write-Host ""
            Write-Host $config
            Write-Host ""
            return
        }
    }

    Set-Content -Path $configFile -Value $config -Encoding UTF8
    Info "$IdeName MCP config written to $configFile"
}

Write-Host ""
Info "Which IDE(s) do you use with GitHub Copilot?"
Write-Host "    1) JetBrains Rider / IntelliJ"
Write-Host "    2) VS Code"
Write-Host "    3) Both"
Write-Host "    4) Skip — I'll configure manually"
$ideChoice = Read-Host "    Choice [1-4]"

# Windows config paths
$intellijConfig = Join-Path $env:APPDATA "github-copilot\intellij"
$vscodeConfig   = Join-Path $env:APPDATA "github-copilot\vscode"

switch ($ideChoice) {
    "1" { Write-McpConfig $intellijConfig "Rider/IntelliJ" }
    "2" { Write-McpConfig $vscodeConfig   "VS Code" }
    "3" {
        Write-McpConfig $intellijConfig "Rider/IntelliJ"
        Write-McpConfig $vscodeConfig   "VS Code"
    }
    "4" { Info "Skipped IDE config. See README.md for manual setup." }
    default { Warn "Unrecognised choice. Skipped IDE config. See README.md for manual setup." }
}

# ── Done ─────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "========================================"
Info "Installation complete."
Write-Host "========================================"
Write-Host ""
Write-Host "  Agents directory: $AgentsDir"
Write-Host "  MCP server:       $(Join-Path $ServerDir 'server.mjs')"
Write-Host ""
Write-Host "  Next steps:"
Write-Host "    1. Restart your IDE (Rider / VS Code)"
Write-Host "    2. Open Copilot Chat in agent mode"
Write-Host "    3. Try: 'List available agents'"
Write-Host "    4. Try: 'Activate the backend architect agent'"
Write-Host ""
Write-Host "  To add a custom agent, drop a .md file into $AgentsDir and restart the IDE."
Write-Host ""

