import { autocmd, Denops } from "./deps.ts";

export async function getBuffer(denops: Denops, bufnr: number) {
  const bufLines = await denops.call(
    "getbufline",
    bufnr,
    1,
    "$",
  ) as string[];

  const lines = bufLines.map((line, i) => {
    // 行番号がある
    if (/^\s*\d+ /.test(line)) {
      return line;
    }

    return `${(i + 1) * 10} ${line}`;
  });

  lines.push("RUN");

  return JSON.stringify({
    body: encodeURIComponent(lines.join("\n") + "\n"),
  });
}

export async function setAutoCmd(denops: Denops) {
  await autocmd.group(
    denops,
    denops.name,
    (helper) => {
      helper.define(
        ["BufDelete"],
        "<buffer>",
        "call denops#request('ichigo', 'close', [])",
      );
    },
  );
}

export async function removeAutoCmd(denops: Denops) {
  await autocmd.group(
    denops,
    denops.name,
    (helper) => {
      helper.remove("*", "<buffer>");
    },
  );
}
