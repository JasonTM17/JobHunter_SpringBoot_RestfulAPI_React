from http.server import BaseHTTPRequestHandler, HTTPServer
from datetime import datetime, timezone
import json
import os


LOG_FILE = os.environ.get("ALERT_LOG_FILE", "/alerts/alerts.log")


class AlertHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path in ("/", "/health"):
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b"ok\n")
            return
        self.send_response(404)
        self.end_headers()

    def do_POST(self):
        length = int(self.headers.get("content-length", "0"))
        body = self.rfile.read(length).decode("utf-8", errors="replace")
        timestamp = datetime.now(timezone.utc).isoformat()

        try:
            payload = json.loads(body)
            rendered = json.dumps(payload, ensure_ascii=True, separators=(",", ":"))
        except json.JSONDecodeError:
            rendered = body

        os.makedirs(os.path.dirname(LOG_FILE), exist_ok=True)
        line = f"{timestamp} {self.path} {rendered}\n"
        with open(LOG_FILE, "a", encoding="utf-8") as handle:
            handle.write(line)

        print(line, end="", flush=True)
        self.send_response(200)
        self.end_headers()
        self.wfile.write(b"received\n")

    def log_message(self, format, *args):
        return


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8080"))
    HTTPServer(("", port), AlertHandler).serve_forever()

