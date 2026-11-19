# 前端启动器：独立运行 npm run dev 并把输出写入 logs/frontend.out.log
# 同 _run-backend.ps1：不能与父进程共享标准输出句柄，否则调用方会挂起
$repoRoot = Split-Path -Parent $PSScriptRoot
$logDir = Join-Path $repoRoot 'logs'
New-Item -ItemType Directory -Force -Path $logDir | Out-Null

Set-Location (Join-Path $repoRoot 'frontend')

$logFile = Join-Path $logDir 'frontend.out.log'

$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = 'cmd.exe'
$psi.Arguments = '/c npm run dev >> "' + $logFile + '" 2>&1'
$psi.WorkingDirectory = (Get-Location).Path
$psi.UseShellExecute = $false
$psi.CreateNoWindow = $true
$psi.RedirectStandardOutput = $false
$psi.RedirectStandardError = $false

$proc = [System.Diagnostics.Process]::Start($psi)
Write-Host "[runner] frontend started, PID=$($proc.Id), log=$logFile"
