import { serve } from "https://deno.land/std@0.165.0/http/server.ts";
import { Denops } from "./deps.ts";

export class Server {
  private denops: Denops;
  private path: string;
  private bufnr: number;
  private sockets: Map<string, WebSocket>;
  private html: string;

  public constructor(d: Denops, p: string, b: number) {
    this.sockets = new Map();
    this.denops = d;
    this.path = p;
    this.bufnr = b;
    this.html = Deno.readTextFileSync(
      new URL("../assets/index.html", import.meta.url),
    );
  }

  public start = async () => {
    serve(this.router, { port: 3000 });

    const watcher = Deno.watchFs(this.path);

    for await (const ev of watcher) {
      for (const path of ev.paths) {
        if (!/\.(te?xt|bas(ic)?)/i.test(path)) {
          continue;
        }

        // console.log(`reload: ${ev.paths[0]}`);
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
