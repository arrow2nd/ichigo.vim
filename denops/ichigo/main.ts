import { Denops, open } from "./libs/deps.ts";

// deno-lint-ignore require-await
export async function main(denops: Denops): Promise<void> {
  denops.dispatcher = {
    async ichigo(): Promise<void> {
      const bufnr = await denops.call("bufnr") as number;
      const bufLines = await denops.call(
        "getbufline",
        bufnr,
        1,
        "$",
      ) as string[];

      const lines = bufLines.map((line, i) => `${(i + 1) * 10} ${line}`);
      lines.push("RUN\n");

      const url = `https://fukuno.jig.jp/app/IchigoJam/#${
        encodeURIComponent(lines.join("\n"))
      }`;

      await open(url);
    },
  };
}
