#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
学习计划本地服务 —— 静态页 + 进度落盘。

零依赖，只用标准库，兼容 Python 3.7+（Mac 自带 3.9.6，老 Ubuntu 只会更旧）。

    python3 tools/plan_server.py                 # 127.0.0.1:8000，自动开浏览器
    python3 tools/plan_server.py --port 8080
    python3 tools/plan_server.py --host 0.0.0.0  # 同网段可访问（见下面警告）

    GET  /api/progress   -> 原样返回 progress/current.json；文件不存在返回 {}
    PUT  /api/progress   -> 校验 rev，加一后原子写盘，并留一份当日快照
    POST /api/progress   -> 同 PUT（有的环境 PUT 会被中间层吃掉）

进度文件在仓库的 progress/ 下，不进 git。rev 不匹配返回 409 + 服务端当前文档，
让前端能提示"别的设备改过"，而不是闷头覆盖。

安全提醒：绑 0.0.0.0 时同网段任何网页都能读写你的进度（Access-Control-Allow-Origin: *）。
默认只绑 127.0.0.1，要对外开放请自己清楚后果，最好只在 Tailscale 之类的内网里用。
"""

import argparse
import json
import mimetypes
import os
import socket
import sys
import tempfile
import threading
import time
import webbrowser
from datetime import datetime
# ThreadingHTTPServer 是 3.7+ 才有的；Mac 自带 3.9.6，够用
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

# ---------------------------------------------------------------- 路径

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WEB_DIR = os.path.join(ROOT, 'main')
PROGRESS_DIR = os.path.join(ROOT, 'progress')
PROGRESS_FILE = os.path.join(PROGRESS_DIR, 'current.json')
HISTORY_DIR = os.path.join(PROGRESS_DIR, 'history')

API_PATH = '/api/progress'

# 整个 read-modify-write 串行化，避免两个请求撞在一起互相覆盖
_LOCK = threading.Lock()


def _log(msg):
    sys.stdout.write(msg + '\n')
    sys.stdout.flush()


def _now_iso():
    # 带本地时区偏移，跟 JS 的 toISOString 不同，可读性更好
    return datetime.now().astimezone().replace(microsecond=0).isoformat()


def _today():
    return datetime.now().strftime('%Y-%m-%d')


# ---------------------------------------------------------------- 落盘


def read_progress():
    """返回 (存在?, 原始字节)。原样返回，归一化交给前端做。"""
    try:
        with open(PROGRESS_FILE, 'rb') as f:
            return True, f.read()
    except (IOError, OSError):
        return False, b'{}'


def _atomic_write(path, data):
    """同目录建临时文件 -> fsync -> os.replace，断电也不会留半个文件。"""
    d = os.path.dirname(path)
    if not os.path.isdir(d):
        os.makedirs(d)
    fd, tmp = tempfile.mkstemp(prefix='.tmp-', dir=d)
    try:
        with os.fdopen(fd, 'wb') as f:
            f.write(data)
            f.flush()
            os.fsync(f.fileno())
        os.replace(tmp, path)
    except Exception:
        try:
            os.unlink(tmp)
        except OSError:
            pass
        raise


def write_progress(doc):
    """doc 是已解析的 dict。写 current.json + 当日快照。调用方需持锁。"""
    payload = json.dumps(doc, ensure_ascii=False, indent=2, sort_keys=True)
    data = payload.encode('utf-8')
    _atomic_write(PROGRESS_FILE, data)
    # 当日快照：同一天反复覆盖，只保留当天最后一份
    try:
        _atomic_write(os.path.join(HISTORY_DIR, _today() + '.json'), data)
    except Exception as e:
        _log('  ! 快照写入失败（不影响主文件）: %s' % e)
    return payload


def _as_dict(v):
    return v if isinstance(v, dict) else {}


def _normalize(doc):
    """服务端只补结构性的默认值，不做字段改名（exportedAt 留给前端）。"""
    doc = _as_dict(doc)
    doc.setdefault('version', 1)
    doc.setdefault('rev', 0)
    doc.setdefault('main', {})
    doc.setdefault('math', {})
    doc.setdefault('streak', {})
    return doc


# ---------------------------------------------------------------- HTTP


class Handler(SimpleHTTPRequestHandler):

    server_version = 'PlanServer/1.0'
    protocol_version = 'HTTP/1.1'

    # ---- 工具

    def _cors(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, PUT, POST, OPTIONS')
        # 不用自定义请求头，预检最简单；rev 放在 body 里
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Access-Control-Max-Age', '86400')

    def _send(self, code, body=b'', ctype='application/json; charset=utf-8', extra=None):
        if isinstance(body, str):
            body = body.encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type', ctype)
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-store')
        self._cors()
        for k, v in (extra or {}).items():
            self.send_header(k, v)
        self.end_headers()
        if self.command != 'HEAD' and body:
            self.wfile.write(body)

    def _json(self, code, obj, extra=None):
        self._send(code, json.dumps(obj, ensure_ascii=False), extra=extra)

    def _read_body(self):
        try:
            n = int(self.headers.get('Content-Length') or 0)
        except ValueError:
            n = 0
        if n <= 0:
            return b''
        return self.rfile.read(n)

    # ---- 路由

    def _path_only(self):
        p = self.path.split('?', 1)[0]
        return p.rstrip('/') or '/'

    def do_OPTIONS(self):
        if self._path_only() == API_PATH:
            self._send(204)
        else:
            self._send(204)

    def do_GET(self):
        if self._path_only() == API_PATH:
            with _LOCK:
                exists, raw = read_progress()
            if not exists:
                self._send(200, b'{}')
                return
            self._send(200, raw)
            return
        SimpleHTTPRequestHandler.do_GET(self)

    def do_HEAD(self):
        if self._path_only() == API_PATH:
            self._send(200, b'')
            return
        SimpleHTTPRequestHandler.do_HEAD(self)

    def do_PUT(self):
        self._write_api()

    def do_POST(self):
        self._write_api()

    def _write_api(self):
        if self._path_only() != API_PATH:
            self._json(404, {'error': 'not found'})
            return
        raw = self._read_body()
        try:
            incoming = json.loads(raw.decode('utf-8'))
        except Exception as e:
            self._json(400, {'error': 'bad json: %s' % e})
            return
        if not isinstance(incoming, dict):
            self._json(400, {'error': 'body must be a JSON object'})
            return

        with _LOCK:
            exists, cur_raw = read_progress()
            cur = {}
            if exists:
                try:
                    cur = _as_dict(json.loads(cur_raw.decode('utf-8')))
                except Exception:
                    # 文件坏了也别把进度全丢掉：备份一份再从零开始
                    try:
                        os.replace(PROGRESS_FILE, PROGRESS_FILE + '.corrupt-%s' % int(time.time()))
                        _log('  ! current.json 解析失败，已另存为 .corrupt-* 并重建')
                    except OSError:
                        pass
                    cur = {}
            cur = _normalize(cur)

            # rev 校验。前端首次写时没有 rev（没发或发 null）→ 客户端无版本，放行。
            client_rev = incoming.get('rev')
            if exists and isinstance(client_rev, int) and client_rev != cur.get('rev', 0):
                self._json(409, cur, extra={'X-Plan-Rev': str(cur.get('rev', 0))})
                return

            doc = _normalize(incoming)
            doc['rev'] = int(cur.get('rev', 0)) + 1
            doc['updatedAt'] = _now_iso()
            try:
                write_progress(doc)
            except Exception as e:
                _log('  ! 写盘失败: %s' % e)
                self._json(500, {'error': 'write failed: %s' % e})
                return

        self._json(200, doc, extra={'X-Plan-Rev': str(doc['rev'])})

    # ---- 静态文件

    def translate_path(self, path):
        # 只在 main/ 下服务。注意：基类那套「会挡 ..」在覆写了这个方法之后就不生效了，
        # 而且带前导 / 时 normpath 会把根以上的 .. 吃掉、不带前导时不会 ——
        # 所以这里逐段过滤，把 .. 和空段全丢掉（否则 GET ../../../../etc/passwd 能读到 Web 根外面）。
        path = path.split('?', 1)[0].split('#', 1)[0]
        clean = os.path.normpath(path).lstrip('/')
        clean = '/'.join(p for p in clean.split('/') if p not in ('', '.', '..'))
        if clean == '':
            clean = 'index.html'
        return os.path.join(WEB_DIR, clean)

    def end_headers(self):
        # 本地开发，别让浏览器缓存住旧的 js
        if self._path_only() != API_PATH:
            self.send_header('Cache-Control', 'no-store')
        SimpleHTTPRequestHandler.end_headers(self)

    def log_message(self, fmt, *args):
        msg = fmt % args
        if ' 200 ' in msg and ('/css/' in msg or '/js/' in msg or '.png' in msg):
            return  # 静态资源刷屏，跳过
        _log('  %s' % msg)


# ---------------------------------------------------------------- 启动


def _lan_ip():
    """本机在局域网里的地址，只为在提示里印一个能用的 URL。

    用 UDP connect 问路由表 —— 不会真的发包，也不依赖外网通不通。
    拿不到就返回 None，绝不影响服务本身。
    """
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(('10.255.255.255', 1))
        return s.getsockname()[0]
    except Exception:
        return None
    finally:
        s.close()


def _bind(host, port, tries=20):
    """端口被占就往后试。返回 (server, port) 或抛异常。"""
    last = None
    for i in range(tries):
        p = port + i
        try:
            srv = ThreadingHTTPServer((host, p), Handler)
            srv.daemon_threads = True
            return srv, p
        except OSError as e:
            last = e
            continue
    raise last


def main():
    ap = argparse.ArgumentParser(description='学习计划本地服务')
    ap.add_argument('--host', default='127.0.0.1',
                    help='监听地址（默认 127.0.0.1；0.0.0.0 = 同网段可访问）')
    ap.add_argument('--port', type=int, default=8000)
    ap.add_argument('--no-browser', action='store_true', help='不自动打开浏览器')
    args = ap.parse_args()

    if not os.path.isdir(WEB_DIR):
        _log('找不到 %s —— 请从仓库根目录运行 tools/plan_server.py' % WEB_DIR)
        return 1

    mimetypes.add_type('text/javascript', '.js')
    mimetypes.add_type('text/css', '.css')
    mimetypes.add_type('image/svg+xml', '.svg')

    try:
        srv, port = _bind(args.host, args.port)
    except OSError as e:
        _log('端口 %d 起 %d 个都被占了：%s' % (args.port, 20, e))
        return 1

    url = 'http://%s:%d/' % ('127.0.0.1' if args.host == '0.0.0.0' else args.host, port)

    _log('')
    _log('  学习计划服务已启动')
    _log('  ─────────────────────────────────────────')
    _log('  网页   %s' % url)
    if args.host == '0.0.0.0':
        lan = _lan_ip()
        if lan:
            _log('  局域网 http://%s:%d/' % (lan, port))
    _log('  静态   %s' % WEB_DIR)
    _log('  进度   %s' % PROGRESS_FILE)
    _log('  快照   %s' % HISTORY_DIR)
    if not os.path.exists(PROGRESS_FILE):
        _log('  （进度文件还不存在，首次保存时自动创建）')
    if args.host == '0.0.0.0':
        _log('')
        _log('  ! 已绑 0.0.0.0：同网段任何网页都能读写你的进度。')
    _log('')
    _log('  Ctrl-C 停止')
    _log('')

    if not args.no_browser:
        threading.Timer(0.4, lambda: webbrowser.open(url)).start()

    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        _log('\n  已停止')
    finally:
        srv.server_close()
    return 0


if __name__ == '__main__':
    sys.exit(main())
