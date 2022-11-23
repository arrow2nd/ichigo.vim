import { Server } from "./libs/server.ts";
import { Denops, open } from "./libs/deps.ts";

let server: Server | undefined;

// deno-lint-ignore require-await
export async function main(denops: Denops): Promise<void> {
  denops.dispatcher = {
    async ichigo(): Promise<void> {
      const path = await denops.call("expand", "%:p:h") as string;
      const bufnr = await denops.call("bufnr") as number;

      server = new Server(denops, path, bufnr);
      server.start();

      await open("http://localhost:3000");
    },
  };
}
