<#
.SYNOPSIS
  校园失物招领平台 — 一键启动（MySQL + 后端 + 前端）

.DESCRIPTION
  按依赖顺序启动三项服务，每步都会等待就绪再继续：
    1. MySQL 3307（独立实例，项目专用）
    2. 后端 API（http://localhost:3000）
    3. 前端 Vite（http://localhost:5173）

  启动完成后自动打开浏览器。日志写入 logs/ 目录。

.PARAMETER NoBrowser
  不自动打开浏览器

.PARAMETER SkipDeps
  跳过 node_modules / .env 缺失检查（快一些，但如果依赖没装会启动失败）

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File scripts\start-all.ps1
  powershell -ExecutionPolicy Bypass -File scripts\start-all.ps1 -NoBrowser
#>
[CmdletBinding()]
param(
  [switch]$NoBrowser,
  [switch]$SkipDeps
)

$ErrorActionPreference = 'Stop'

# ---------- 路径 ----------
$repoRoot    = Split-Path -Parent $PSScriptRoot
$backendDir  = Join-Path $repoRoot 'backend'
$frontendDir = Join-Path $repoRoot 'frontend'
$logDir      = Join-Path $repoRoot 'logs'
$mysqlScript = 'D:\dsh_project\.tools\start-mysql-lf.ps1'

$backendUrl  = 'http://localhost:3000'
$frontendUrl = 'http://localhost:5173'

New-Item -ItemType Directory -Force -Path $logDir | Out-Null

# ---------- 工具函数 ----------
function Write-Step($n, $total, $text) {
  Write-Host ""
  Write-Host "[$n/$total] $text" -ForegroundColor Cyan
}

# 端口探测：同时尝试 IPv4 与 IPv6
# Vite 默认只监听 ::1（IPv6），只测 127.0.0.1 会永远判定失败
function Test-Port($port, $timeoutSec = 2) {
  foreach ($addr in @('127.0.0.1', '::1')) {
    try {
      $client = New-Object System.Net.Sockets.TcpClient
      $task = $client.ConnectAsync($addr, $port)
      $connected = $task.Wait($timeoutSec * 1000) -and $client.Connected
      $client.Close()
      if ($connected) { return $true }
    } catch { }
  }
  return $false
}

function Wait-Http($url, $timeoutSec, $label) {
  $deadline = (Get-Date).AddSeconds($timeoutSec)
  while ((Get-Date) -lt $deadline) {
    try {
      $res = Invoke-WebRequest -Uri $url -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop
      if ($res.StatusCode -eq 200) { return $true }
    } catch { }
    Start-Sleep -Milliseconds 500
  }
  Write-Host "  [超时] $label 未在 $timeoutSec 秒内就绪" -ForegroundColor Red
  return $false
}

function Start-Detached($exe, $arguments, $workDir) {
  # 用 .NET Process 显式启动并立即释放句柄，避免父脚本被挂住
  $psi = New-Object System.Diagnostics.ProcessStartInfo
  $psi.FileName = $exe
  $psi.Arguments = $arguments
  $psi.WorkingDirectory = $workDir
  $psi.UseShellExecute = $false
  $psi.CreateNoWindow = $true
  $proc = [System.Diagnostics.Process]::Start($psi)
  return $proc.Id
}

function Assert-Command($name, $hint) {
  if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
    Write-Host "  [缺失] 找不到命令 '$name'。$hint" -ForegroundColor Red
    return $false
  }
  return $true
}

# ---------- 前置检查 ----------
Write-Host "========================================" -ForegroundColor Green
Write-Host " 校园失物招领平台 — 启动中" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

if (-not $SkipDeps) {
  Write-Host "\n检查环境…" -ForegroundColor Yellow

  $ok = $true
  $ok = (Assert-Command 'node' '请安装 Node.js 26 LTS（仓库根 .nvmrc 固定为 26）') -and $ok
  $ok = (Assert-Command 'npm'  'npm 随 Node.js 一起安装') -and $ok

  if (-not (Test-Path (Join-Path $backendDir 'node_modules'))) {
    Write-Host "  [缺失] backend/node_modules 不存在，请先执行：cd backend; npm ci" -ForegroundColor Red
    $ok = $false
  }
  if (-not (Test-Path (Join-Path $frontendDir 'node_modules'))) {
    Write-Host "  [缺失] frontend/node_modules 不存在，请先执行：cd frontend; npm ci" -ForegroundColor Red
    $ok = $false
  }
  if (-not (Test-Path (Join-Path $backendDir '.env'))) {
    Write-Host "  [缺失] backend/.env 不存在，请先执行：Copy-Item backend/.env.example backend/.env" -ForegroundColor Red
    $ok = $false
  }
  if (-not (Test-Path (Join-Path $frontendDir '.env'))) {
    Write-Host "  [缺失] frontend/.env 不存在，请先执行：Copy-Item frontend/.env.example frontend/.env" -ForegroundColor Red
    $ok = $false
  }
  if (-not (Test-Path $mysqlScript)) {
    Write-Host "  [缺失] MySQL 启动脚本不存在：$mysqlScript" -ForegroundColor Red
    $ok = $false
  }

  if (-not $ok) {
    Write-Host "\n前置检查未通过，已中止。" -ForegroundColor Red
    exit 1
  }
  Write-Host "  环境检查通过" -ForegroundColor Green
}

$totalSteps = 3

# ---------- 1. MySQL ----------
Write-Step 1 $totalSteps "启动 MySQL（端口 3307）"

if (Test-Port 3307) {
  Write-Host "  已在运行，跳过" -ForegroundColor DarkGray
} else {
  & powershell -ExecutionPolicy Bypass -File $mysqlScript | ForEach-Object { Write-Host "  $_" }
  # 仅端口通不代表可查询，用 SQL 确认
  # 注意：MySQL 启动初期查询会报 ERROR 2003，需屏蔽 stderr 且不让其中断脚本
  $ready = $false
  $deadline = (Get-Date).AddSeconds(60)
  $mysqlExe = 'D:\mysql-8.2.0-winx64\bin\mysql.exe'
  $prevEAP = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  while ((Get-Date) -lt $deadline) {
    if (Test-Path $mysqlExe) {
      try {
        $out = & $mysqlExe @('-uroot', '-P3307', '-h127.0.0.1', '-N', '-e', 'SELECT 1;') 2>&1 | Out-String
        if ($out -match '(?m)^1\s*$') { $ready = $true; break }
      } catch { }
    } elseif (Test-Port 3307) { $ready = $true; break }
    Start-Sleep -Milliseconds 800
  }
  $ErrorActionPreference = $prevEAP
  if (-not $ready) {
    Write-Host "  [失败] MySQL 未就绪，请查看 D:\dsh_project\.tools\lf.err.log" -ForegroundColor Red
    exit 1
  }
  Write-Host "  就绪（SQL 连通）" -ForegroundColor Green
}

# ---------- 2. 后端 ----------
Write-Step 2 $totalSteps "启动后端 API（端口 3000）"

if (Test-Port 3000) {
  Write-Host "  已在运行，跳过" -ForegroundColor DarkGray
} else {
  # Prisma Client 必须先生成：缺失或与 schema 不同步时后端无法启动
  $prismaClientIdx = Join-Path $backendDir 'node_modules\.prisma\client\index.js'
  $prismaSchema   = Join-Path $backendDir 'prisma\schema.prisma'
  $needGenerate = $true
  if (Test-Path $prismaClientIdx) {
    $clientTime = (Get-Item $prismaClientIdx).LastWriteTime
    $schemaTime = (Get-Item $prismaSchema).LastWriteTime
    # Client 比 schema 新才认为是最新的
    if ($clientTime -gt $schemaTime) { $needGenerate = $false }
  }

  if ($needGenerate) {
    Write-Host "  Prisma Client 未生成或已过期，正在生成…" -ForegroundColor Yellow
    Push-Location $backendDir
    try {
      $env:TEMP = Join-Path $logDir 'tmp'
      $env:TMP  = $env:TEMP
      New-Item -ItemType Directory -Force -Path $env:TEMP | Out-Null
      $genOut = & npx prisma generate 2>&1 | Out-String
      if ($LASTEXITCODE -ne 0) {
        Write-Host "  [失败] prisma generate 出错：" -ForegroundColor Red
        Write-Host $genOut -ForegroundColor DarkGray
        Pop-Location
        exit 1
      }
      Write-Host "  生成完成" -ForegroundColor Green
    } finally {
      Pop-Location
    }
  } else {
    Write-Host "  Prisma Client 已是最新" -ForegroundColor DarkGray
  }
  $backendOut = Join-Path $logDir 'backend.out.log'
  $backendErr = Join-Path $logDir 'backend.err.log'
  $env:TEMP = Join-Path $repoRoot 'logs\tmp'
  $env:TMP  = $env:TEMP
  New-Item -ItemType Directory -Force -Path $env:TEMP | Out-Null

  # 用独立 powershell 进程运行启动器；-PassThru 拿到 PID 但不持有输出句柄，
  # 日志由启动器内部重定向写入 logs/
  $runner = Join-Path $PSScriptRoot '_run-backend.ps1'
  $backendProc = Start-Process -FilePath 'powershell.exe' `
    -ArgumentList '-ExecutionPolicy', 'Bypass', '-File', $runner `
    -PassThru -WindowStyle Hidden
  Write-Host "  启动进程 PID=$($backendProc.Id)" -ForegroundColor DarkGray

  if (-not (Wait-Http "$backendUrl/health" 90 '后端 /health')) {
    Write-Host "  请查看日志：$backendOut" -ForegroundColor Yellow
    exit 1
  }
  Write-Host "  就绪：$backendUrl/health" -ForegroundColor Green
}

# ---------- 3. 前端 ----------
Write-Step 3 $totalSteps "启动前端（端口 5173）"

if (Test-Port 5173) {
  Write-Host "  已在运行，跳过" -ForegroundColor DarkGray
} else {
  $frontendOut = Join-Path $logDir 'frontend.out.log'
  $frontendErr = Join-Path $logDir 'frontend.err.log'

  # 同上
  $runner = Join-Path $PSScriptRoot '_run-frontend.ps1'
  $frontendProc = Start-Process -FilePath 'powershell.exe' `
    -ArgumentList '-ExecutionPolicy', 'Bypass', '-File', $runner `
    -PassThru -WindowStyle Hidden
  Write-Host "  启动进程 PID=$($frontendProc.Id)" -ForegroundColor DarkGray

  if (-not (Wait-Http $frontendUrl 90 '前端首页')) {
    Write-Host "  请查看日志：$frontendOut" -ForegroundColor Yellow
    exit 1
  }
  Write-Host "  就绪：$frontendUrl" -ForegroundColor Green
}

# ---------- 完成 ----------
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host " 启动完成" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host " 前端：   $frontendUrl" -ForegroundColor White
Write-Host " 后端：   $backendUrl/health" -ForegroundColor White
Write-Host ""
Write-Host " 演示账号：student2026 / Passw0rd!" -ForegroundColor Yellow
Write-Host " 管理员：  admin / Admin@2026" -ForegroundColor Yellow
Write-Host ""
Write-Host " 关闭服务：powershell -ExecutionPolicy Bypass -File scripts\stop-all.ps1" -ForegroundColor DarkGray
Write-Host " 日志目录：$logDir" -ForegroundColor DarkGray

if (-not $NoBrowser) {
  Write-Host ""
  Write-Host " 正在打开浏览器…" -ForegroundColor Cyan
  Start-Process $frontendUrl
}
