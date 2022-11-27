import { Denops } from "./deps.ts";

export async function getBuffer(denops: Denops, bufnr: number) {
  const bufLines = await denops.call(
    "getbufline",
    bufnr,
    1,
    "$",
  ) as string[];

  // TODO: 行番号がある場合を考慮
  const lines = bufLines.map((line, i) => `${(i + 1) * 10} ${line}`);

  // TODO: 最終行がRUNで終わる場合には付与しない
  lines.push("RUN\n");

  return JSON.stringify({
    body: encodeURIComponent(lines.join("\n")),
  });
}
