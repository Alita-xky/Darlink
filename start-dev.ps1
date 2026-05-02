Param(
    [switch]$Recreate
)

$envName = "darlink"
$repoRoot = Split-Path -Parent $PSScriptRoot
$backend = Join-Path $repoRoot "backend"
$model = Join-Path $repoRoot "model_service"

Write-Host "[darlink] 开始启动开发环境脚本"

# 检查 conda
try {
    & conda --version > $null 2>&1
} catch {
    Write-Error "未检测到 conda，请先安装 Anaconda/Miniconda 并确保 conda 在 PATH 中。"
    exit 1
}

# 创建或重建环境
$envs = conda env list | Out-String
if ($envs -notmatch "^$envName\s") {
    Write-Host "创建 conda 环境 $envName (Python 3.11)..."
    conda create -n $envName python=3.11 -y
} elseif ($Recreate) {
    Write-Host "重建环境 $envName..."
    conda remove -n $envName --all -y
    conda create -n $envName python=3.11 -y
} else {
    Write-Host "已检测到 conda 环境 $envName，跳过创建。使用 -Recreate 强制重建。"
}

Write-Host "安装 Python 依赖（backend & model_service）..."
# 安装依赖
& conda run -n $envName python -m pip install --upgrade pip setuptools wheel
& conda run -n $envName python -m pip install -r "$backend\requirements.txt"
& conda run -n $envName python -m pip install -r "$model\requirements.txt"

Write-Host "启动 model_service (端口 8001) 和 backend (端口 8000)，各自打开新终端窗口。"

# 启动 model_service
Start-Process powershell -ArgumentList @(
    '-NoExit',
    '-Command',
    "conda activate $envName; cd '$model'; uvicorn service:app --reload --port 8001"
) -Verb RunAs

# 启动 backend
Start-Process powershell -ArgumentList @(
    '-NoExit',
    '-Command',
    "conda activate $envName; cd '$backend'; uvicorn app:app --reload --port 8000"
) -Verb RunAs

Write-Host "已发起启动命令。请查看新打开的终端窗口以确认服务已启动。"
