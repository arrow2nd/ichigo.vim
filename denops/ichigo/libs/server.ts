import { getBuffer } from "./buf.ts";
import { Denops, serve } from "./deps.ts";

export class Server {
  private _denops: Denops;
  private _path: string;
  private _bufnr: number;

  private _abortCtrl: AbortController;
  private _html: string;
  private _sockets: Map<string, WebSocket>;

  public constructor(denops: Denops, path: string, bufnr: number) {
    this._denops = denops;
    this._path = path;
    this._bufnr = bufnr;

    this._abortCtrl = new AbortController();
    this._html = Deno.readTextFileSync(
      new URL("../assets/index.html", import.meta.url),
    );
    this._sockets = new Map();
  }

  public start = async (port: number) => {
    serve(this.router, { signal: this._abortCtrl.signal, port });

    const watcher = Deno.watchFs(this._path);

    for await (const ev of watcher) {
      for (const path of ev.paths) {
        if (!/\.(te?xt|bas(ic)?)/i.test(path)) {
          continue;
        }

        this.sendReload();
      }
    }
  };

  public close = async () => {
    this._abortCtrl.abort();

    await Promise.all(
      [...this._sockets.values()].map((s) => s.close()),
    );

    console.info("server is closed");
  };

  private router = (req: Request): Response => {
    const { pathname } = new URL(req.url);
    const notFound = new Response("Not Found", { status: 404 });

    if (req.method !== "GET") {
      return notFound;
    }

    if (pathname === "/") {
      return new Response(this._html, {
        status: 200,
        headers: { "content-type": "text/html" },
      });
    }

    if (pathname === "/ws") {
      const { socket, response } = Deno.upgradeWebSocket(req);
      const uuid = crypto.randomUUID();

      socket.onopen = async () => {
        const json = await getBuffer(this._denops, this._bufnr);
        socket.send(json);
      };

      socket.onclose = () => {
        this._sockets.delete(uuid);
      };

      this._sockets.set(uuid, socket);

      return response;
    }

    return notFound;
  };

  private sendReload = async () => {
    const json = await getBuffer(this._denops, this._bufnr);

    await Promise.all(
      [...this._sockets.values()].map((s) => s.send(json)),
    );
  };
}
