<#
.SYNOPSIS
  校园失物招领平台 — 一键关闭（前端 + 后端 + MySQL）

.DESCRIPTION
  按依赖逆序关闭三项服务，避免后端连接被数据库单方面断开：
    1. 前端 Vite（5173）
    2. 后端 API（3000）
    3. MySQL 3307（项目专用实例，不影响系统 3306 实例）

  只关闭本项目占用的端口，不会误杀其他 node 进程。

.PARAMETER KeepMySQL
  保留 MySQL 运行（下次启动更快）

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File scripts\stop-all.ps1
  powershell -ExecutionPolicy Bypass -File scripts\stop-all.ps1 -KeepMySQL
#>
[CmdletBinding()]
param(
  [switch]$KeepMySQL
)

$ErrorActionPreference = 'Continue'

$repoRoot    = Split-Path -Parent $PSScriptRoot
$mysqlScript = 'D:\dsh_project\.tools\stop-mysql-lf.ps1'

# 端口探测：同时尝试 IPv4 与 IPv6（Vite 默认只监听 ::1）
function Test-Port($port) {
  foreach ($addr in @('127.0.0.1', '::1')) {
    try {
      $client = New-Object System.Net.Sockets.TcpClient
      $task = $client.ConnectAsync($addr, $port)
      $connected = $task.Wait(1000) -and $client.Connected
      $client.Close()
      if ($connected) { return $true }
    } catch { }
  }
  return $false
}

# 只杀监听指定端口的进程，且校验是 node 或命令行匹配项目路径
function Stop-ByPort($port, $label) {
  $conns = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
  if (-not $conns) {
    Write-Host "  $label （端口 $port）未在运行" -ForegroundColor DarkGray
    return
  }

  $killed = 0
  foreach ($pid_ in ($conns | Select-Object -ExpandProperty OwningProcess -Unique)) {
    $proc = Get-CimInstance Win32_Process -Filter "ProcessId=$pid_" -ErrorAction SilentlyContinue
    if (-not $proc) { continue }

    $cmd = if ($proc.CommandLine) { $proc.CommandLine } else { '' }
    # 安全校验：必须与项目相关，避免误杀其他服务
    $isProject = ($cmd -like "*$repoRoot*") -or
                 ($cmd -like '*vite*' -and $cmd -like '*campus-LostandFound*') -or
                 ($cmd -like '*tsx*' -and $cmd -like '*campus-LostandFound*')

    if (-not $isProject) {
      Write-Host "  [跳过] 端口 $port 被非本项目进程占用（PID $pid_）" -ForegroundColor Yellow
      continue
    }

    # node 起的 npm run 会有子进程，先杀进程树
    $children = Get-CimInstance Win32_Process -Filter "ParentProcessId=$pid_" -ErrorAction SilentlyContinue
    foreach ($child in $children) {
      Stop-Process -Id $child.ProcessId -Force -ErrorAction SilentlyContinue
    }
    Stop-Process -Id $pid_ -Force -ErrorAction SilentlyContinue
    $killed++
  }

  if ($killed -gt 0) {
    Write-Host "  $label 已关闭" -ForegroundColor Green
  }
}

Write-Host "========================================" -ForegroundColor Yellow
Write-Host " 校园失物招领平台 — 关闭中" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""

Write-Host "关闭前端（5173）…" -ForegroundColor Cyan
Stop-ByPort 5173 '前端'

Write-Host "关闭后端（3000）…" -ForegroundColor Cyan
Stop-ByPort 3000 '后端'

if ($KeepMySQL) {
  Write-Host "保留 MySQL（-KeepMySQL）" -ForegroundColor DarkGray
} else {
  Write-Host "关闭 MySQL（3307）…" -ForegroundColor Cyan
  if (Test-Port 3307) {
    if (Test-Path $mysqlScript) {
      & powershell -ExecutionPolicy Bypass -File $mysqlScript | ForEach-Object { Write-Host "  $_" }
    } else {
      Write-Host "  [警告] 停止脚本不存在：$mysqlScript" -ForegroundColor Yellow
    }
  } else {
    Write-Host "  MySQL（端口 3307）未在运行" -ForegroundColor DarkGray
  }
}

Start-Sleep -Seconds 2

# ---------- 结果核验 ----------
Write-Host ""
Write-Host "端口状态：" -ForegroundColor Yellow
$ports = @(
  @{ Port = 5173; Name = '前端' },
  @{ Port = 3000; Name = '后端' },
  @{ Port = 3307; Name = 'MySQL' }
)
$allClosed = $true
foreach ($p in $ports) {
  $open = Test-Port $p.Port
  if ($open) {
    if ($p.Port -eq 3307 -and $KeepMySQL) {
      Write-Host ("  {0,-8} {1} 运行中（已保留）" -f $p.Name, $p.Port) -ForegroundColor DarkGray
    } else {
      Write-Host ("  {0,-8} {1} 仍在监听" -f $p.Name, $p.Port) -ForegroundColor Red
      $allClosed = $false
    }
  } else {
    Write-Host ("  {0,-8} {1} 已释放" -f $p.Name, $p.Port) -ForegroundColor Green
  }
}

Write-Host ""
if ($allClosed -or $KeepMySQL) {
  Write-Host "关闭完成。" -ForegroundColor Green
} else {
  Write-Host "部分端口仍被占用，可用管理员权限检查残留进程。" -ForegroundColor Yellow
  exit 1
}
