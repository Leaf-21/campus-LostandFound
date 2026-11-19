# 前端启动器：独立运行 npm run dev
# 由 start-all.ps1 以独立进程调用，日志写入 logs/frontend.out.log
$repoRoot = Split-Path -Parent $PSScriptRoot
$logDir = Join-Path $repoRoot 'logs'
New-Item -ItemType Directory -Force -Path $logDir | Out-Null

Set-Location (Join-Path $repoRoot 'frontend')

& npm run dev 2>&1 | ForEach-Object {
  $line = "[{0:HH:mm:ss}] {1}" -f (Get-Date), $_
  Add-Content -Path (Join-Path $logDir 'frontend.out.log') -Value $line -Encoding utf8
}
