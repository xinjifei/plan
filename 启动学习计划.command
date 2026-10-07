#!/bin/bash
# 双击这个文件：起本地服务 + 自动开浏览器，进度会自动写进 progress/current.json
# 首次双击若被 Gatekeeper 拦住：右键 -> 打开 -> 打开

cd "$(dirname "$0")" || exit 1

P=""
for c in python3 python; do
  if command -v "$c" >/dev/null 2>&1; then P="$c"; break; fi
done

if [ -z "$P" ]; then
  echo "没找到 python3。"
  echo "Mac 可以装：xcode-select --install"
  echo
  read -r -p "按回车关闭..."
  exit 1
fi

exec "$P" tools/plan_server.py "$@"
