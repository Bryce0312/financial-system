$ErrorActionPreference = "Stop"
$normalizedPath = [System.Environment]::GetEnvironmentVariable("Path", "Machine")
if ($normalizedPath) {
$env:Path = $normalizedPath
}
Remove-Item Env:PATH -ErrorAction SilentlyContinue


function Write-Step {
  param([string]$Message)
  Write-Host "==> $Message" -ForegroundColor Cyan
}

function Test-PortListening {
  param([int]$Port)
  return [bool](Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1)
}

function Wait-ForPort {
  param(
    [int]$Port,
    [int]$TimeoutSeconds = 30
  )

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  while ((Get-Date) -lt $deadline) {
    if (Test-PortListening -Port $Port) {
      return $true
    }
    Start-Sleep -Milliseconds 500
  }

  return $false
}

function Resolve-RequiredCommand {
  param([string]$Name)

  $command = Get-Command $Name -ErrorAction SilentlyContinue
  if (-not $command) {
    throw "Required command not found: $Name"
  }

  return $command.Source
}

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$logsDir = Join-Path $root ".logs"
$postgresDataDir = Join-Path $root ".local\postgres\data"
$postgresPidPath = Join-Path $postgresDataDir "postmaster.pid"
$postgresStdOut = Join-Path $root ".local\postgres\postgres-runtime.out.log"
$postgresStdErr = Join-Path $root ".local\postgres\postgres-runtime.err.log"
$apiOut = Join-Path $logsDir "api.tsnode.out.log"
$apiErr = Join-Path $logsDir "api.tsnode.err.log"
$webOut = Join-Path $logsDir "web.start.out.log"
$webErr = Join-Path $logsDir "web.start.err.log"

New-Item -ItemType Directory -Force -Path $logsDir | Out-Null

$nodePath = "C:\Program Files\nodejs\node.exe"
$postgresPath = Join-Path $env:USERPROFILE ".conda\envs\financial-system\Library\bin\postgres.exe"

if (-not (Test-Path $postgresPath)) {
  throw "PostgreSQL executable not found at $postgresPath"
}

Write-Step "Checking PostgreSQL"
if (-not (Test-PortListening -Port 5432)) {
  if (Test-Path $postgresPidPath) {
    $pidLines = Get-Content -LiteralPath $postgresPidPath -ErrorAction SilentlyContinue
    if ($pidLines.Count -gt 0) {
      $oldPid = 0
      [void][int]::TryParse($pidLines[0], [ref]$oldPid)
      if ($oldPid -gt 0 -and -not (Get-Process -Id $oldPid -ErrorAction SilentlyContinue)) {
        Remove-Item -LiteralPath $postgresPidPath -Force
      }
    }
  }

  Start-Process -FilePath $postgresPath -ArgumentList "-D", $postgresDataDir, "-p", "5432" -RedirectStandardOutput $postgresStdOut -RedirectStandardError $postgresStdErr | Out-Null
  if (-not (Wait-ForPort -Port 5432 -TimeoutSeconds 20)) {
    throw "PostgreSQL did not start on port 5432. Check $postgresStdErr"
  }
}
Write-Host "PostgreSQL ready on 5432" -ForegroundColor Green

Write-Step "Checking API"
if (-not (Test-PortListening -Port 3001)) {
  $apiWorkingDirectory = Join-Path $root "apps\api"
  Start-Process -FilePath $nodePath -WorkingDirectory $apiWorkingDirectory -ArgumentList "-r", "ts-node/register/transpile-only", "-r", "tsconfig-paths/register", "src/main.ts" -RedirectStandardOutput $apiOut -RedirectStandardError $apiErr | Out-Null

  if (-not (Wait-ForPort -Port 3001 -TimeoutSeconds 25)) {
    throw "API did not start on port 3001. Check $apiErr"
  }
}
Write-Host "API ready on 3001" -ForegroundColor Green

Write-Step "Checking Web"
if (-not (Test-PortListening -Port 3000)) {
  $webWorkingDirectory = Join-Path $root "apps\web"
  $webCacheDir = Join-Path $webWorkingDirectory ".next"
  if (Test-Path $webCacheDir) {
    Remove-Item -LiteralPath $webCacheDir -Recurse -Force -ErrorAction SilentlyContinue
  }

  $nextPath = Join-Path $root "node_modules\next\dist\bin\next"
  $nextBuildDir = Join-Path $webWorkingDirectory ".next"
  if (-not (Test-Path $nextPath)) {
    throw "Next.js executable not found at $nextPath"
  }

  if (Test-Path $nextBuildDir) {
    Remove-Item -LiteralPath $nextBuildDir -Recurse -Force -ErrorAction SilentlyContinue
  }

  Start-Process -FilePath $nodePath -WorkingDirectory $webWorkingDirectory -ArgumentList $nextPath, "dev", "-H", "127.0.0.1", "-p", "3000" -RedirectStandardOutput $webOut -RedirectStandardError $webErr | Out-Null

  if (-not (Wait-ForPort -Port 3000 -TimeoutSeconds 30)) {
    throw "Web server did not start on port 3000. Check $webErr"
  }
}
Write-Host "Web ready on 3000" -ForegroundColor Green

Write-Host ""
Write-Host "Open these URLs:" -ForegroundColor Yellow
Write-Host "  Web   http://127.0.0.1:3000/login"
Write-Host "  API   http://127.0.0.1:3001/auth/login"
Write-Host ""
Write-Host "Logs:" -ForegroundColor Yellow
Write-Host "  PostgreSQL stdout  $postgresStdOut"
Write-Host "  PostgreSQL stderr  $postgresStdErr"
Write-Host "  API stdout         $apiOut"
Write-Host "  API stderr         $apiErr"
Write-Host "  Web stdout         $webOut"
Write-Host "  Web stderr         $webErr"


