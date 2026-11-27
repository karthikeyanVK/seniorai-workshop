import test from "node:test";
import assert from "node:assert/strict";
import { chunkMarkdown, estimateTokens } from "./chunker";
import { parseFrontMatter } from "./frontmatter";

const O = { maxTokens: 100, minTokens: 20, hardMaxTokens: 160, overlapTokens: 16 };

test("short doc -> single chunk", () => {
  const c = chunkMarkdown("# T\n\nhello world.", O);
  assert.equal(c.length, 1);
  assert.equal(c[0].index, 0);
});

test("splits on headings and keeps breadcrumb", () => {
  const sec = (n: string) => `## ${n}\n\n${"word ".repeat(70)}`;
  const c = chunkMarkdown(`# T\n\n${sec("A")}\n\n### Sub\n\n${"x ".repeat(150)}\n\n${sec("B")}`, O);
  assert.ok(c.length >= 3);
  assert.ok(c.some((x) => x.headingPath === "A > Sub"));
  assert.ok(c.every((x) => x.tokens <= O.hardMaxTokens));
});

test("oversize table split repeats header row", () => {
  const rows = Array.from({ length: 60 }, (_, i) => `| row${i} | value value value |`).join("\n");
  const c = chunkMarkdown(`# T\n\n## Tbl\n\n| a | b |\n|---|---|\n${rows}`, O);
  assert.ok(c.length > 1);
  for (const x of c) assert.ok(x.text.includes("| a | b |"), "header repeated");
});

test("huge paragraph splits with overlap", () => {
  const para = Array.from({ length: 120 }, (_, i) => `Sentence number ${i} is here.`).join(" ");
  const c = chunkMarkdown(`# T\n\n## P\n\n${para}`, O);
  assert.ok(c.length > 1);
  const lastSentence = c[0].text.match(/Sentence number \d+ is here\.$/)![0];
  assert.ok(c[1].text.includes(lastSentence), "overlap present");
  assert.ok(estimateTokens(c[0].text) <= O.hardMaxTokens);
});

test("front matter arrays + scalars", () => {
  const { meta, body } = parseFrontMatter("---\ndoc_id: D-1\ncustomer_ids: [C1, C2]\nlead_ids: []\n---\n# x");
  assert.equal(meta.doc_id, "D-1");
  assert.deepEqual(meta.customer_ids, ["C1", "C2"]);
  assert.deepEqual(meta.lead_ids, []);
  assert.equal(body, "# x");
});
