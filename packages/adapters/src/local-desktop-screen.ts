import http from "node:http";
import type { AddressInfo } from "node:net";

export const LOCAL_DESKTOP_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Rakazo desktop</title>
    <style>
      html, body { margin: 0; height: 100%; background: #0b1220; overflow: hidden; }
      canvas { display: block; width: 100%; height: 100%; }
    </style>
  </head>
  <body data-desktop-view="1">
    <canvas id="desktop-stream" width="1280" height="800"></canvas>
    <script>
      const canvas = document.getElementById("desktop-stream");
      const ctx = canvas.getContext("2d");
      function frame(t) {
        ctx.fillStyle = "#1a3a6b";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#2d6cdf";
        ctx.beginPath();
        ctx.arc(1080, 90, 48, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#12141a";
        ctx.fillRect(160, 90, 860, 560);
        ctx.fillStyle = "#ececef";
        ctx.font = "28px sans-serif";
        ctx.fillText("Team Computer", 190, 140);
        ctx.fillStyle = "#1c1e24";
        ctx.fillRect(0, canvas.height - 48, canvas.width, 48);
        ctx.fillStyle = "#8bd17c";
        ctx.fillRect(16, canvas.height - 36, 24, 24);
        requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    </script>
  </body>
</html>
`;

export class LocalDesktopScreen {
  private server: http.Server | undefined;
  private port = 0;

  async listen() {
    if (this.server) return this;
    this.server = http.createServer((req, res) => {
      const path = req.url?.split("?")[0] ?? "/";
      if (path === "/" || path === "/embed.html") {
        res.writeHead(200, {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "no-store",
        });
        res.end(LOCAL_DESKTOP_HTML);
        return;
      }
      res.writeHead(404).end();
    });
    await new Promise<void>((resolve, reject) => {
      this.server!.once("error", reject);
      this.server!.listen(0, "127.0.0.1", () => resolve());
    });
    const address = this.server.address() as AddressInfo;
    this.port = address.port;
    return this;
  }

  url() {
    if (!this.port) throw new Error("local desktop screen is not listening");
    return `http://127.0.0.1:${this.port}/embed.html`;
  }

  async close() {
    const server = this.server;
    this.server = undefined;
    this.port = 0;
    if (!server) return;
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}
