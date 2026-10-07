@echo off
chcp 65001 >nul
rem 双击这个文件：起本地服务 + 自动开浏览器，进度会自动写进 progress\current.json

cd /d "%~dp0"

set "PY="
where py >nul 2>nul && set "PY=py -3"
if not defined PY ( where python >nul 2>nul && set "PY=python" )
if not defined PY ( where python3 >nul 2>nul && set "PY=python3" )

if not defined PY (
  echo 没找到 Python。
  echo 去 https://www.python.org/downloads/ 装一个，装的时候记得勾 "Add Python to PATH"。
  echo.
  pause
  exit /b 1
)

%PY% tools\plan_server.py %*
pause
