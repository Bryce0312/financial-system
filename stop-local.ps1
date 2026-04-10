param(
  [switch]$Quiet
)

$ErrorActionPreference = "Stop"
$machinePath = [Environment]::GetEnvironmentVariable("Path", "Machine")
$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
$env:Path = (($machinePath, $userPath) | Where-Object { $_ } | Select-Object -Unique) -join ";"

function Write-Step {
  param([string]$Message)
  if (-not $Quiet) {
    Write-Host "==> $Message" -ForegroundColor Cyan
  }
}

function Write-Info {
  param([string]$Message)
  if (-not $Quiet) {
    Write-Host $Message -ForegroundColor Green
  }
}

function Get-ListeningProcessIds {
  param([int]$Port)

  $connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
  if (-not $connections) {
    return @()
  }

  return $connections | Select-Object -ExpandProperty OwningProcess -Unique
}

function Stop-ProcessSafe {
  param([int]$ProcessId)

  if ($ProcessId -le 0) {
    return
  }

  $target = Get-Process -Id $ProcessId -ErrorAction SilentlyContinue
  if (-not $target) {
    return
  }

  try {
    Stop-Process -Id $ProcessId -Force -ErrorAction Stop
  }
  catch {
    if (-not $Quiet) {
      Write-Host ("Failed to stop process {0}: {1}" -f $ProcessId, $_.Exception.Message) -ForegroundColor Yellow
    }
  }
}

function Wait-ForPortToClose {
  param(
    [int]$Port,
    [int]$TimeoutSeconds = 12
  )

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  while ((Get-Date) -lt $deadline) {
    $active = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    if (-not $active) {
      return $true
    }
    Start-Sleep -Milliseconds 400
  }

  return $false
}

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$postgresDataDir = Join-Path $repoRoot '.local\postgres\data'
$postgresPidPath = Join-Path $postgresDataDir 'postmaster.pid'
$postgresExe = Join-Path $env:USERPROFILE '.conda\envs\financial-system\Library\bin\postgres.exe'

Write-Step 'Stopping web/api listeners'
foreach ($port in 3000, 3001, 5432) {
  $processIds = Get-ListeningProcessIds -Port $port
  foreach ($processId in $processIds) {
    Stop-ProcessSafe -ProcessId $processId
  }
  [void](Wait-ForPortToClose -Port $port)
}

Write-Step 'Stopping PostgreSQL residual processes'
if (Test-Path $postgresPidPath) {
  $pidLines = Get-Content -Path $postgresPidPath -ErrorAction SilentlyContinue
  if ($pidLines) {
    $postgresProcessId = 0
    [void][int]::TryParse($pidLines[0], [ref]$postgresProcessId)
    if ($postgresProcessId -gt 0) {
      Stop-ProcessSafe -ProcessId $postgresProcessId
    }
  }
}

$postgresProcesses = Get-Process -Name postgres -ErrorAction SilentlyContinue
foreach ($process in $postgresProcesses) {
  $shouldStop = $true
  try {
    if ($process.Path) {
      $shouldStop = $process.Path -eq $postgresExe
    }
  }
  catch {
    $shouldStop = $true
  }

  if ($shouldStop) {
    Stop-ProcessSafe -ProcessId $process.Id
  }
}

foreach ($port in 5432, 3001, 3000) {
  [void](Wait-ForPortToClose -Port $port)
}

if (Test-Path $postgresPidPath) {
  Remove-Item -LiteralPath $postgresPidPath -Force -ErrorAction SilentlyContinue
}

Write-Info 'Local backend/web services stopped.'


