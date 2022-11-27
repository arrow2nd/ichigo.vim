import { Denops, getFreePort, serve } from "./deps.ts";

const DEFAULT_PORT = 3000;

export class Server {
  private denops: Denops;
  private path: string;
  private bufnr: number;

  private html: string;
  private port: number;
  private sockets: Map<string, WebSocket>;

  public constructor(d: Denops, p: string, b: number) {
    this.denops = d;
    this.path = p;
    this.bufnr = b;

    this.html = Deno.readTextFileSync(
      new URL("../assets/index.html", import.meta.url),
    );
    this.port = 0;
    this.sockets = new Map();
  }

  public start = async () => {
    this.port = await getFreePort(DEFAULT_PORT);
    serve(this.router, { port: this.port });

    const watcher = Deno.watchFs(this.path);

    for await (const ev of watcher) {
      for (const path of ev.paths) {
        if (!/\.(te?xt|bas(ic)?)/i.test(path)) {
          continue;
        }

        this.sendReload();
      }
    }
  };

  private router = (req: Request): Response => {
    const { pathname } = new URL(req.url);
    const notFound = new Response("Not Found", { status: 404 });

    if (req.method !== "GET") {
      return notFound;
    }

    if (pathname === "/") {
      return new Response(this.html, {
        status: 200,
        headers: { "content-type": "text/html" },
      });
    }

    if (pathname === "/ws") {
      const { socket, response } = Deno.upgradeWebSocket(req);
      const uuid = crypto.randomUUID();

      socket.onopen = async () => {
        // FIXME: undefindになる
        const json = await this.getBuffer();
        socket.send(JSON.stringify(json));
      };

      socket.onclose = () => {
        this.sockets.delete(uuid);
      };

      this.sockets.set(uuid, socket);

      return response;
    }

    return notFound;
  };

  private sendReload = async () => {
    const json = await this.getBuffer();

    await Promise.all(
      [...this.sockets.values()].map((s) => s.send(json)),
    );
  };

  private getBuffer = async (): Promise<string> => {
    const bufLines = await this.denops.call(
      "getbufline",
      this.bufnr,
      1,
      "$",
    ) as string[];

    const lines = bufLines.map((line, i) => `${(i + 1) * 10} ${line}`);
    lines.push("RUN\n");

    return JSON.stringify({
      body: encodeURIComponent(lines.join("\n")),
    });
  };
}
