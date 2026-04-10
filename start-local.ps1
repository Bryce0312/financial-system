$ErrorActionPreference = "Stop"
$machinePath = [Environment]::GetEnvironmentVariable("Path", "Machine")
$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
$env:Path = (($machinePath, $userPath) | Where-Object { $_ } | Select-Object -Unique) -join ";"

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

function Test-HttpStatus {
  param(
    [string]$Url,
    [int]$ExpectedStatus = 200,
    [int]$TimeoutSeconds = 20
  )

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  while ((Get-Date) -lt $deadline) {
    try {
      $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5
      if ($response.StatusCode -eq $ExpectedStatus) {
        return $true
      }
    }
    catch {
    }
    Start-Sleep -Milliseconds 700
  }

  return $false
}

function Wait-ForPostgres {
  param(
    [string]$PgIsReadyPath,
    [int]$TimeoutSeconds = 60
  )

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  while ((Get-Date) -lt $deadline) {
    $output = & $PgIsReadyPath -h 127.0.0.1 -p 5432 2>&1
    if ($LASTEXITCODE -eq 0) {
      return $true
    }

    $message = ($output | Out-String)
    if ($message -match 'rejecting connections') {
      Start-Sleep -Seconds 1
      continue
    }

    Start-Sleep -Milliseconds 700
  }

  return $false
}

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$logsDir = Join-Path $root '.logs'
$postgresDataDir = Join-Path $root '.local\postgres\data'
$postgresPidPath = Join-Path $postgresDataDir 'postmaster.pid'
$postgresStdOut = Join-Path $root '.local\postgres\postgres-runtime.out.log'
$postgresStdErr = Join-Path $root '.local\postgres\postgres-runtime.err.log'
$apiOut = Join-Path $logsDir 'api.tsnode.out.log'
$apiErr = Join-Path $logsDir 'api.tsnode.err.log'
$webOut = Join-Path $logsDir 'web.start.out.log'
$webErr = Join-Path $logsDir 'web.start.err.log'
$stopScriptPath = Join-Path $root 'stop-local.ps1'

New-Item -ItemType Directory -Force -Path $logsDir | Out-Null

$nodePath = 'C:\Program Files\nodejs\node.exe'
$postgresPath = Join-Path $env:USERPROFILE '.conda\envs\financial-system\Library\bin\postgres.exe'
$pgIsReadyPath = Join-Path $env:USERPROFILE '.conda\envs\financial-system\Library\bin\pg_isready.exe'
$nextPath = Join-Path $root 'node_modules\next\dist\bin\next'

if (-not (Test-Path $postgresPath)) {
  throw "PostgreSQL executable not found at $postgresPath"
}
if (-not (Test-Path $pgIsReadyPath)) {
  throw "pg_isready executable not found at $pgIsReadyPath"
}
if (-not (Test-Path $nodePath)) {
  throw "Node executable not found at $nodePath"
}
if (-not (Test-Path $nextPath)) {
  throw "Next.js executable not found at $nextPath"
}
if (-not (Test-Path $stopScriptPath)) {
  throw "stop-local.ps1 not found at $stopScriptPath"
}

Write-Step 'Stopping previous local services for a clean start'
powershell -NoProfile -ExecutionPolicy Bypass -File $stopScriptPath -Quiet
Start-Sleep -Seconds 1

Write-Step 'Starting PostgreSQL'
if (Test-Path $postgresPidPath) {
  Remove-Item -LiteralPath $postgresPidPath -Force -ErrorAction SilentlyContinue
}
if (Test-Path $postgresStdOut) {
  Remove-Item -LiteralPath $postgresStdOut -Force -ErrorAction SilentlyContinue
}
if (Test-Path $postgresStdErr) {
  Remove-Item -LiteralPath $postgresStdErr -Force -ErrorAction SilentlyContinue
}

$postgresCommand = "& '$postgresPath' -D '$postgresDataDir' -p 5432 1>> '$postgresStdOut' 2>> '$postgresStdErr'"
Start-Process -FilePath 'powershell.exe' -ArgumentList '-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', $postgresCommand -WindowStyle Hidden | Out-Null
if (-not (Wait-ForPostgres -PgIsReadyPath $pgIsReadyPath -TimeoutSeconds 75)) {
  throw "PostgreSQL did not become ready on port 5432. Check $postgresStdErr"
}
Write-Host 'PostgreSQL ready on 5432' -ForegroundColor Green

Write-Step 'Starting API'
$apiWorkingDirectory = Join-Path $root 'apps\api'
Start-Process -FilePath $nodePath -WorkingDirectory $apiWorkingDirectory -ArgumentList '-r', 'ts-node/register/transpile-only', '-r', 'tsconfig-paths/register', 'src/main.ts' -RedirectStandardOutput $apiOut -RedirectStandardError $apiErr | Out-Null
if (-not (Wait-ForPort -Port 3001 -TimeoutSeconds 25)) {
  throw "API did not start on port 3001. Check $apiErr"
}
Write-Host 'API ready on 3001' -ForegroundColor Green

Write-Step 'Building and starting Web'
$webWorkingDirectory = Join-Path $root 'apps\web'
$webBuildDir = Join-Path $webWorkingDirectory '.next'
if (Test-Path $webBuildDir) {
  Remove-Item -LiteralPath $webBuildDir -Recurse -Force -ErrorAction SilentlyContinue
}

Push-Location $webWorkingDirectory
try {
  & $nodePath $nextPath build 2>&1 | Tee-Object -FilePath $webOut
  if ($LASTEXITCODE -ne 0) {
    throw "Web build failed. Check $webOut"
  }
}
finally {
  Pop-Location
}

Start-Process -FilePath $nodePath -WorkingDirectory $webWorkingDirectory -ArgumentList $nextPath, 'start', '-H', '0.0.0.0', '-p', '3000' -RedirectStandardOutput $webOut -RedirectStandardError $webErr | Out-Null
if (-not (Wait-ForPort -Port 3000 -TimeoutSeconds 30)) {
  throw "Web server did not start on port 3000. Check $webErr"
}
if (-not (Test-HttpStatus -Url 'http://127.0.0.1:3000/login' -ExpectedStatus 200 -TimeoutSeconds 20)) {
  throw "Web health check failed on /login. Check $webErr"
}
Write-Host 'Web ready on 3000' -ForegroundColor Green

Write-Host ''
Write-Host 'Open these URLs:' -ForegroundColor Yellow
Write-Host '  Web   http://127.0.0.1:3000/login`n  LAN   http://<your-lan-ip>:3000/login'
Write-Host '  API   http://127.0.0.1:3001/auth/login'
Write-Host ''
Write-Host 'Logs:' -ForegroundColor Yellow
Write-Host "  PostgreSQL stdout  $postgresStdOut"
Write-Host "  PostgreSQL stderr  $postgresStdErr"
Write-Host "  API stdout         $apiOut"
Write-Host "  API stderr         $apiErr"
Write-Host "  Web stdout         $webOut"
Write-Host "  Web stderr         $webErr"
