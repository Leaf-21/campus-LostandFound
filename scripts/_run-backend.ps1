# 后端启动器：独立运行 npm run dev
# 由 start-all.ps1 以独立进程调用，日志写入 logs/backend.out.log
$repoRoot = Split-Path -Parent $PSScriptRoot
$logDir = Join-Path $repoRoot 'logs'
New-Item -ItemType Directory -Force -Path $logDir | Out-Null

Set-Location (Join-Path $repoRoot 'backend')

# 临时目录指向项目内，避免系统 TEMP 权限问题
$env:TEMP = Join-Path $logDir 'tmp'
$env:TMP  = $env:TEMP
New-Item -ItemType Directory -Force -Path $env:TEMP | Out-Null

# 逐行输出到日志，避免整块缓冲
& npm run dev 2>&1 | ForEach-Object {
  $line = "[{0:HH:mm:ss}] {1}" -f (Get-Date), $_
  Add-Content -Path (Join-Path $logDir 'backend.out.log') -Value $line -Encoding utf8
}
