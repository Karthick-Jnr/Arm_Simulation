"""
Lightweight Local HTTP Server Launcher for Robotic Arm Simulator
Starts a local web server and opens the browser automatically.
"""

import http.server
import socketserver
import webbrowser
import os
import sys

PORT = 8080
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

def main():
    os.chdir(DIRECTORY)
    # Allow port reuse
    socketserver.TCPServer.allow_reuse_address = True
    
    try:
        with socketserver.TCPServer(("", PORT), Handler) as httpd:
            url = f"http://localhost:{PORT}/index.html"
            print("=" * 70)
            print(" 🤖 ROBOTIC ARM 3D SIMULATOR & HARDWARE SIZING SUITE")
            print(f" 🌐 Running at: {url}")
            print(" Press Ctrl+C in terminal to stop server.")
            print("=" * 70)
            webbrowser.open(url)
            httpd.serve_forever()
    except OSError as e:
        # Fallback to port 8081 if 8080 is busy
        alt_port = 8081
        with socketserver.TCPServer(("", alt_port), Handler) as httpd:
            url = f"http://localhost:{alt_port}/index.html"
            print(f"Port {PORT} in use, opened on {url}")
            webbrowser.open(url)
            httpd.serve_forever()

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n[✓] Server stopped.")

