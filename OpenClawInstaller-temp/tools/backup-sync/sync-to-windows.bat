@echo off
chcp 65001 >nul
echo.
echo ╔══════════════════════════════════════════════════════╗
echo ║           🔄 OpenClaw 同步工具 (Batch)                ║
echo ╚══════════════════════════════════════════════════════╝
echo.

if "%1"=="" goto help
if "%1"=="all" goto all
if "%1"=="manager" goto manager
if "%1"=="openclaw" goto openclaw
if "%1"=="opencode" goto opencode
goto help

:manager
echo 正在同步 openclaw-manager...
robocopy "\\wsl.localhost\Ubuntu-24.04\home\reamaster\openclaw-manager" "C:\Users\ReaMasTer\openclaw-manager" /E /COPYALL /R:3 /W:2 /MT:8 /NP
goto end

:openclaw
echo 正在同步 OpenClaw 配置...
robocopy "\\wsl.localhost\Ubuntu-24.04\home\reamaster\.openclaw" "C:\Users\ReaMasTer\.openclaw" /E /COPYALL /R:3 /W:2 /MT:8 /NP
goto end

:opencode
echo 正在同步 OpenCode 配置...
robocopy "\\wsl.localhost\Ubuntu-24.04\home\reamaster\.opencode" "C:\Users\ReaMasTer\.opencode" /E /COPYALL /R:3 /W:2 /MT:8 /NP
goto end

:all
echo 正在同步全部...
echo.
echo [1/3] openclaw-manager...
robocopy "\\wsl.localhost\Ubuntu-24.04\home\reamaster\openclaw-manager" "C:\Users\ReaMasTer\openclaw-manager" /E /COPYALL /R:3 /W:2 /MT:8 /NP
echo.
echo [2/3] OpenClaw 配置...
robocopy "\\wsl.localhost\Ubuntu-24.04\home\reamaster\.openclaw" "C:\Users\ReaMasTer\.openclaw" /E /COPYALL /R:3 /W:2 /MT:8 /NP
echo.
echo [3/3] OpenCode 配置...
robocopy "\\wsl.localhost\Ubuntu-24.04\home\reamaster\.opencode" "C:\Users\ReaMasTer\.opencode" /E /COPYALL /R:3 /W:2 /MT:8 /NP
goto end

:help
echo 用法:
echo   sync.bat all         同步全部
echo   sync.bat manager     同步 openclaw-manager
echo   sync.bat openclaw    同步 OpenClaw 配置
echo   sync.bat opencode    同步 OpenCode 配置
echo.
echo 路徑對應:
echo   WSL:     \\wsl.localhost\Ubuntu-24.04\home\reamaster\...
echo   Windows: C:\Users\ReaMasTer\...
echo.

:end
echo.
echo 完成!
pause
