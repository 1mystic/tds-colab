#!/usr/bin/env python3
"""
TDS Collaboration Hub : Lightweight API Server
Serves static files + provides JSON API for centralized data storage.

Usage: python3 server.py
Runs on http://localhost:8765
"""

import http.server
import json
import os

PORT = 8765
DATA_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data.json')

DEFAULT_DATA = {
    "config": {
        "ga": {
            "1": {"name": "GA 1", "questions": 37},
            "2": {"name": "GA 2", "questions": 0},
            "3": {"name": "GA 3", "questions": 0},
            "4": {"name": "GA 4", "questions": 0},
            "5": {"name": "GA 5", "questions": 0}
        },
        "projects": {
            "1": {"name": "Project 1", "questions": 4},
            "2": {"name": "Project 2", "questions": 0}
        },
        "roe": {"enabled": False, "questions": 0},
        "links": []
    },
    "submissions": {},
    "bulk": {},
    "leaderboard": {}
}


def read_data():
    """Read data.json, create with defaults if missing."""
    if not os.path.exists(DATA_FILE):
        write_data(DEFAULT_DATA)
        return DEFAULT_DATA
    try:
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except (json.JSONDecodeError, IOError):
        return DEFAULT_DATA


def write_data(data):
    """Write data to data.json."""
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


class TDSHandler(http.server.SimpleHTTPRequestHandler):
    """Handles static files + /api/data endpoint."""

    def do_GET(self):
        if self.path == '/api/data':
            data = read_data()
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(data).encode('utf-8'))
        else:
            super().do_GET()

    def do_POST(self):
        if self.path == '/api/data':
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            try:
                incoming = json.loads(body)
                write_data(incoming)
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(b'{"ok":true}')
            except json.JSONDecodeError:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(b'{"error":"Invalid JSON"}')
        else:
            self.send_response(404)
            self.end_headers()

    def do_OPTIONS(self):
        """Handle CORS preflight."""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def log_message(self, format, *args):
        """Quieter logging: skip static file requests."""
        if '/api/' in str(args[0]):
            super().log_message(format, *args)


if __name__ == '__main__':
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    with http.server.HTTPServer(('', PORT), TDSHandler) as server:
        print(f'\n  TDS Server running at http://localhost:{PORT}\n')
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            print('\n  Server stopped.')
