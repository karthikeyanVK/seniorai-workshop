export interface ChunkOptions {
  maxTokens: number;
  minTokens: number;
  hardMaxTokens: number;
  overlapTokens: number;
}
export interface Chunk {
  index: number;
  headingPath: string;
  text: string;
  tokens: number;
}

// ponytail: ~4 chars/token estimate; swap in js-tiktoken if sizing must be exact.
export const estimateTokens = (s: string): number => Math.ceil(s.length / 4);

interface Section {
  path: string[];
  heading: string;
  blocks: string[];
}

const HEADING = /^(#{1,3})\s+(.+?)\s*#*\s*$/;
const FENCE = /^\s*```/;
const isTableLine = (l: string) => /^\s*\|.*\|\s*$/.test(l);

/** Split a section body into blocks: tables and fenced code stay atomic, paragraphs/lists split on blank lines. */
function toBlocks(lines: string[]): string[] {
  const blocks: string[] = [];
  let cur: string[] = [];
  let mode: "p" | "t" | "f" = "p";
  const flush = () => {
    if (cur.length) blocks.push(cur.join("\n"));
    cur = [];
  };
  for (const l of lines) {
    if (mode === "f") {
      cur.push(l);
      if (FENCE.test(l)) { flush(); mode = "p"; }
    } else if (FENCE.test(l)) {
      flush(); cur.push(l); mode = "f";
    } else if (isTableLine(l)) {
      if (mode !== "t") { flush(); mode = "t"; }
      cur.push(l);
    } else if (l.trim() === "") {
      flush(); mode = "p";
    } else {
      if (mode === "t") { flush(); mode = "p"; }
      cur.push(l);
    }
  }
  flush();
  return blocks;
}

function parseSections(body: string): Section[] {
  const sections: Section[] = [];
  const stack: string[] = []; // headings of level 2..3
  let cur: Section = { path: [], heading: "", blocks: [] };
  let buf: string[] = [];
  let fence = false;
  const close = () => {
    cur.blocks = toBlocks(buf);
    if (cur.heading || cur.blocks.length) sections.push(cur);
    buf = [];
  };
  for (const line of body.split(/\r?\n/)) {
    if (FENCE.test(line)) fence = !fence;
    const m = !fence ? line.match(HEADING) : null;
    if (m) {
      close();
      const level = m[1].length;
      if (level >= 2) { stack.length = level - 2; stack[level - 2] = m[2]; }
      cur = { path: level === 1 ? [] : stack.slice(), heading: line.trim(), blocks: [] };
    } else buf.push(line);
  }
  close();
  return sections;
}

/** Sentence-aware split with token overlap, for oversize prose. */
function splitText(text: string, max: number, overlap: number): string[] {
  const maxC = max * 4;
  const sentences = text.split(/(?<=[.!?])\s+|\n/).flatMap((s) => {
    const out: string[] = [];
    for (let i = 0; i < s.length; i += maxC) out.push(s.slice(i, i + maxC));
    return out;
  });
  const pieces: string[] = [];
  let cur: string[] = [];
  let len = 0;
  for (const s of sentences) {
    if (len + s.length > maxC && cur.length) {
      pieces.push(cur.join(" "));
      let keep = 0;
      const tail: string[] = [];
      for (let i = cur.length - 1; i >= 0 && keep < overlap * 4; i--) { tail.unshift(cur[i]); keep += cur[i].length; }
      cur = keep + s.length <= maxC ? tail : [];
      len = cur.reduce((a, x) => a + x.length + 1, 0);
    }
    cur.push(s);
    len += s.length + 1;
  }
  if (cur.length) pieces.push(cur.join(" "));
  return pieces;
}

/** Split an oversize table by rows, repeating the header row in each piece. */
function splitTable(table: string, max: number): string[] {
  const lines = table.split("\n");
  const hasSep = lines.length > 1 && /^\s*\|?[\s:|-]+\|[\s:|-]*$/.test(lines[1]);
  const header = hasSep ? lines.slice(0, 2) : [];
  const rows = hasSep ? lines.slice(2) : lines;
  const hTok = estimateTokens(header.join("\n"));
  const pieces: string[] = [];
  let cur: string[] = [];
  let tok = hTok;
  for (const r of rows) {
    const t = estimateTokens(r) + 1;
    if (tok + t > max && cur.length) { pieces.push([...header, ...cur].join("\n")); cur = []; tok = hTok; }
    cur.push(r); tok += t;
  }
  if (cur.length) pieces.push([...header, ...cur].join("\n"));
  return pieces;
}

function shrinkBlock(b: string, o: ChunkOptions): string[] {
  if (estimateTokens(b) <= o.hardMaxTokens) return [b];
  return isTableLine(b.split("\n")[0]) ? splitTable(b, o.maxTokens) : splitText(b, o.maxTokens, o.overlapTokens);
}

/**
 * Structural chunking: short docs -> one chunk; otherwise split on #/##/### sections,
 * merge undersized neighbours, pack oversize sections by block (oversize tables split by rows
 * with the header repeated), falling back to sentence splitting with overlap for huge paragraphs.
 */
export function chunkMarkdown(body: string, o: ChunkOptions): Chunk[] {
  const text = body.trim();
  if (!text) return [];
  const out: Omit<Chunk, "index">[] = [];
  const push = (headingPath: string, t: string) => {
    const s = t.trim();
    if (s) out.push({ headingPath, text: s, tokens: estimateTokens(s) });
  };
  const done = () => out.map((c, index) => ({ ...c, index }));

  if (estimateTokens(text) <= o.maxTokens) {
    push(parseSections(text).find((s) => s.path.length)?.path.join(" > ") ?? "", text);
    return done();
  }

  let pend: { path: string; text: string } | null = null;
  const flush = () => { if (pend) push(pend.path, pend.text); pend = null; };

  for (const sec of parseSections(text)) {
    const path = sec.path.join(" > ");
    const full = [sec.heading, ...sec.blocks].filter(Boolean).join("\n\n");
    const tok = estimateTokens(full);
    if (tok <= o.maxTokens) {
      if (pend && estimateTokens(pend.text) < o.minTokens && estimateTokens(pend.text) + tok <= o.maxTokens) {
        pend.text += "\n\n" + full;
      } else { flush(); pend = { path, text: full }; }
      continue;
    }
    // oversize section: pack blocks greedily (an undersized leading chunk, e.g. the H1, joins the first piece)
    const lead: string | null = pend && estimateTokens(pend.text) < o.minTokens ? pend.text : null;
    if (lead) pend = null;
    else flush();
    let cur: string[] = [...(lead ? [lead] : []), ...(sec.heading ? [sec.heading] : [])];
    let curTok = estimateTokens(cur.join("\n\n"));
    for (const b of sec.blocks.flatMap((x) => shrinkBlock(x, o))) {
      const t = estimateTokens(b);
      if (curTok + t > o.maxTokens && cur.length) { push(path, cur.join("\n\n")); cur = []; curTok = 0; }
      cur.push(b); curTok += t;
    }
    if (cur.length) push(path, cur.join("\n\n"));
  }
  flush();
  return done();
}
