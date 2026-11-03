from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import mimetypes
import os
from urllib.parse import urlsplit


ROOT = Path(__file__).resolve().parent
mimetypes.add_type("application/manifest+json", ".webmanifest")


class AppHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_GET(self):
        request_path = urlsplit(self.path).path
        if request_path == "/api/health":
            body = b'{"status":"ok","app":"hamghadam"}'
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        if request_path == "/":
            request_path = "/index.html"
        allowed_files = {"index.html", "styles.css", "app.js", "manifest.webmanifest", "service-worker.js", "icon.svg"}
        filename = request_path.lstrip("/")
        if filename not in allowed_files:
            self.send_error(404)
            return
        file_path = ROOT / filename
        body = file_path.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", mimetypes.guess_type(filename)[0] or "application/octet-stream")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def end_headers(self):
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "strict-origin-when-cross-origin")
        super().end_headers()


if __name__ == "__main__":
    host = os.environ.get("HAMGHADAM_HOST", "127.0.0.1")
    port = int(os.environ.get("PORT", "8000"))
    server = ThreadingHTTPServer((host, port), AppHandler)
    print(f"HamGhadam is running at http://{host}:{port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down HamGhadam...")
    finally:
        server.server_close()
