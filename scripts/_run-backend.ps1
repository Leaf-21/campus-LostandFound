# 后端启动器：独立运行 npm run dev 并把输出写入 logs/backend.out.log
# 关键：本脚本会常驻（dev server 不退出），因此绝不能与父进程共享标准输出句柄，
#       否则调用方（start-all.ps1）的管道会一直等待，表现为「卡住」。
$repoRoot = Split-Path -Parent $PSScriptRoot
$logDir = Join-Path $repoRoot 'logs'
New-Item -ItemType Directory -Force -Path $logDir | Out-Null

Set-Location (Join-Path $repoRoot 'backend')

# 临时目录指向项目内，避免系统 TEMP 权限问题
$env:TEMP = Join-Path $logDir 'tmp'
$env:TMP  = $env:TEMP
New-Item -ItemType Directory -Force -Path $env:TEMP | Out-Null

$logFile = Join-Path $logDir 'backend.out.log'

# 用独立 cmd 进程承载 npm，重定向到文件；-PassThru 后立即放句柄
# 这样本 powershell 进程也无需等待，可直接退出
$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = 'cmd.exe'
$psi.Arguments = '/c npm run dev >> "' + $logFile + '" 2>&1'
$psi.WorkingDirectory = (Get-Location).Path
$psi.UseShellExecute = $false
$psi.CreateNoWindow = $true
# 关键：不继承父进程句柄
$psi.RedirectStandardOutput = $false
$psi.RedirectStandardError = $false

$proc = [System.Diagnostics.Process]::Start($psi)

# 本脚本到此即可退出；npm/dev server 由 cmd 进程继续托管
Write-Host "[runner] backend started, PID=$($proc.Id), log=$logFile"
