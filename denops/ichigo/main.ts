import { Server } from "./libs/server.ts";
import { Denops, filetype, getFreePort, open } from "./libs/deps.ts";
import { removeAutoCmd, setAutoCmd } from "./libs/buf.ts";

const DEFAULT_PORT = 3000;
let server: Server | undefined;

export function main(denops: Denops) {
  denops.dispatcher = {
    async run(): Promise<void> {
      if (await filetype.get(denops) !== "basic") {
        console.error("file type is not basic");
        return;
      }

      // 既に起動していたら閉じる
      if (server) {
        server.close();
      }

      await setAutoCmd(denops);

      const path = await denops.call("expand", "%:p") as string;
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

      await removeAutoCmd(denops);
      await server.close();

      server = undefined;
    },
  };
}
