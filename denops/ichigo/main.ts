import { Server } from "./libs/server.ts";
import { Denops, getFreePort, open } from "./libs/deps.ts";

const DEFAULT_PORT = 3000;
let server: Server | undefined;

export function main(denops: Denops) {
  denops.dispatcher = {
    async run(): Promise<void> {
      if (server) {
        server.close();
      }

      const path = await denops.call("expand", "%:p:h") as string;
      const bufnr = await denops.call("bufnr") as number;
      server = new Server(denops, path, bufnr);

      const port = await getFreePort(DEFAULT_PORT);
      server.start(port);

      await open(`http://localhost:${port}`);
    },
    async close(): Promise<void> {
      if (!server) {
        console.error("server is not running");
        return;
      }

      await server.close();
      server = undefined;
    },
  };
}
