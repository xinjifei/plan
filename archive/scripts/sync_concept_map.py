"""
从 concept_map.py 生成 app.js 使用的 JavaScript 概念映射数据。
运行: python sync_concept_map.py
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent / "data"))
from concept_map import MAIN_CONCEPTS, MATH_RECALL


def py_to_js(obj, indent=0):
    """Convert Python dict to JavaScript object literal"""
    if obj is None:
        return "null"
    if isinstance(obj, bool):
        return "true" if obj else "false"
    if isinstance(obj, (int, float)):
        return str(obj)
    if isinstance(obj, str):
        escaped = obj.replace("\\", "\\\\").replace('"', '\\"').replace("\n", "\\n")
        return f'"{escaped}"'
    if isinstance(obj, dict):
        items = []
        for k, v in obj.items():
            items.append(f'{"  " * (indent+1)}{k}: {py_to_js(v, indent+1)}')
        return "{\n" + ",\n".join(items) + "\n" + "  " * indent + "}"
    if isinstance(obj, list):
        items = [py_to_js(v, indent+1) for v in obj]
        return "[" + ", ".join(items) + "]"
    return f'"{obj}"'


def generate():
    print("// Auto-generated from concept_map.py — DO NOT EDIT BY HAND")
    print("// Run: python sync_concept_map.py")
    print()
    print("const MAIN_CONCEPTS =", py_to_js(MAIN_CONCEPTS), ";", sep="")
    print()
    print("const MATH_RECALL =", py_to_js(MATH_RECALL), ";", sep="")


if __name__ == "__main__":
    generate()
