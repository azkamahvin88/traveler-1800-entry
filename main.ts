// One Sentence for a Traveler from 1800 — make.fun entry (program/v1).
//
// The entry is ONE sentence, at most 200 characters, that explains the
// modern internet to a time traveler who has just stepped out of 1800.
// A judge model reads two sentences at a time and picks the one that
// would leave a traveler from 1800 with the truest, clearest picture.
//
// This program scores a shortlist of candidate sentences against the
// judge brief's priority order — explains first, then built from what
// a person of 1800 already knows, then true, then tight, then
// memorable — and writes the winner, with no trailing newline, to
// /output/entry.txt.
//
// The hard constraint is the 1800 vocabulary: every word in the entry
// must be one a person of 1800 could know (letters, presses, town
// criers, libraries, markets, roads, light). No "computer", "online",
// "website", "email", "app", "stream", "digital", "screen", "data",
// "network", "internet" — not even the word for the thing itself, so
// the sentence must carry the whole picture in one 1800 analogy.
//
// Deterministic: no network, no model calls, no randomness, no clock.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

type Candidate = {
  text: string;
  explains: number; // 1-5: a traveler grasps what the internet is and does
  grounded: number; // 1-5: built from 1800 knowledge, no post-1800 words
  truth: number; // 1-5: true of the internet, nothing misleading if literal
  tight: number; // 1-5: every word earns its place, no filler, no list
  memorable: number; // 1-5: one image a reader still holds a week later
};

// The shortlist, brainstormed against the brief. One vivid analogy
// beats a list of features every time, so each candidate is a single
// picture, not a catalogue.
const CANDIDATES: Candidate[] = [
  {
    // Three 1800 institutions collapse into one room you can enter
    // from your chair: knowledge (library), letters (post office),
    // trade and news (market) — the whole internet in one picture.
    // Every word predates 1800; "fits in one room" is the memorable
    // image, and "from your own chair" carries the remote-access truth.
    text: "Every library, post office and market in the world now fits in one room, and you may step inside from your own chair.",
    explains: 5,
    grounded: 5,
    truth: 4,
    tight: 4,
    memorable: 5,
  },
  {
    // A library with no walls: short, tight, memorable, and the
    // "any voice may answer back" tail adds the two-way truth.
    // Loses to the winner on breadth — books alone understate the
    // internet's letters, markets and faces.
    text: "It is a library with no walls, where every book in the world lies open and any voice may answer back.",
    explains: 4,
    grounded: 5,
    truth: 4,
    tight: 5,
    memorable: 5,
  },
  {
    // One great room holding everything, open to any soul. Same
    // family as the winner, but "walk in and read them" is flatter
    // than "fits in one room ... from your own chair", and it says
    // nothing about the market's trade or the post's letters going
    // both ways.
    text: "One great room holds every book, letter, song and face in the world, and any soul alive may walk in and read them.",
    explains: 5,
    grounded: 5,
    truth: 4,
    tight: 4,
    memorable: 4,
  },
  {
    // A looking-glass you can ask: vivid and 1800-true, but it reads
    // as a window for looking only, and misses that you can also
    // write back, sell, and shout.
    text: "Imagine a looking-glass that shows any face, book or letter in the world the moment you ask it to.",
    explains: 4,
    grounded: 5,
    truth: 4,
    tight: 4,
    memorable: 4,
  },
  {
    // A road of light carrying the world's letters, books and songs.
    // True and pretty, but a road only carries things one way, and
    // "ride one road of light" is a harder picture to hold than a room.
    text: "All the world's letters, books and voices now ride one road of light, and anyone may call them to his door in an instant.",
    explains: 4,
    grounded: 4,
    truth: 4,
    tight: 4,
    memorable: 4,
  },
  {
    // A road of light to every house: the speed is right, but it
    // explains only the carrying, not what is carried or what you
    // can do with it once it arrives.
    text: "A road of light runs to every house, carrying all the world's letters, books and songs to any hearth in an instant.",
    explains: 4,
    grounded: 4,
    truth: 4,
    tight: 4,
    memorable: 4,
  },
  {
    // The post office as one shelf of every letter ever written.
    // Lovely, but letters are only one corner of the internet; a
    // traveler would leave thinking it is only mail.
    text: "Think of a post office where every letter ever written waits on one shelf, and anyone may read it in an instant.",
    explains: 3,
    grounded: 5,
    truth: 3,
    tight: 4,
    memorable: 4,
  },
  {
    // Every town crier shouting at once: the noisiest true picture
    // of the internet, and very memorable — but it is only the
    // shouting half, not the library or the market.
    text: "Every town crier in the world now shouts at once, and you can hear each one from your own chair.",
    explains: 3,
    grounded: 5,
    truth: 3,
    tight: 4,
    memorable: 5,
  },
  {
    // A market square that never sleeps: true of the buying and the
    // noise, false as a whole — the internet is not only a market.
    text: "It is a market square that never sleeps, where every stall in the world sells its news, songs and pictures at once.",
    explains: 3,
    grounded: 5,
    truth: 3,
    tight: 4,
    memorable: 4,
  },
  {
    // A post road of light, a letter arriving before the ink is dry:
    // the tightest, most memorable single image here — but again
    // only mail, and the traveler learns nothing of the library.
    text: "It is a post road of light, where a letter from any corner of the world arrives before the ink is dry.",
    explains: 3,
    grounded: 4,
    truth: 4,
    tight: 5,
    memorable: 5,
  },
  {
    // Everything on one shelf, open to all, with voices answering
    // back. Covers breadth and the two-way truth, but "waits on one
    // shelf" is a weaker image than a room you can step inside.
    text: "Every letter, book and song in the world now waits on one shelf, open to all at once, and any voice may answer back.",
    explains: 4,
    grounded: 5,
    truth: 4,
    tight: 4,
    memorable: 3,
  },
  {
    // Three institutions named at once — crier, library, market —
    // but naming them is a list wearing a sentence's clothes, and
    // "from every house" muddles where the shouting happens.
    text: "It is a town crier, a library and a market all at once, shouting, lending and selling from every house in the world.",
    explains: 4,
    grounded: 5,
    truth: 3,
    tight: 3,
    memorable: 4,
  },
];

// Score in the brief's own order: explains, then grounded, then true,
// then tight, then memorable. Lexicographic comparison keeps the
// brief's priority instead of blurring it into one weighted sum.
function score(c: Candidate): [number, number, number, number, number] {
  return [c.explains, c.grounded, c.truth, c.tight, c.memorable];
}

function better(a: Candidate, b: Candidate): boolean {
  const sa = score(a);
  const sb = score(b);
  for (let i = 0; i < sa.length; i++) {
    if (sa[i] !== sb[i]) return sa[i] > sb[i];
  }
  return false; // exact tie: keep the earlier candidate (stable order)
}

let best = CANDIDATES[0];
for (const c of CANDIDATES.slice(1)) {
  if (better(c, best)) best = c;
}

const entry = best.text;

// Vocabulary guard: no word coined after the traveler's time may
// smuggle itself into the sentence. The list is the obvious modern
// vocabulary for the thing being explained; any hit fails the run
// rather than shipping a sentence the brief would punish.
const MODERN_WORDS = [
  "internet", "computer", "online", "website", "email", "app",
  "stream", "digital", "screen", "data", "network", "software",
  "phone", "television", "video", "wifi", "cloud", "server",
];
const entryWords = entry.toLowerCase().split(/[^a-z]+/).filter(Boolean);
for (const w of MODERN_WORDS) {
  if (entryWords.includes(w)) {
    throw new Error(`entry uses a post-1800 word: ${w}`);
  }
}

// Gate self-check: 1 to 200 characters, not whitespace-only, and a
// single sentence (exactly one terminal full stop, at the end).
if (entry.length < 1 || entry.length > 200) {
  throw new Error(`entry length ${entry.length} outside gate 1-200`);
}
if (!/\S/.test(entry)) {
  throw new Error("entry is whitespace-only");
}
if ((entry.match(/\./g) ?? []).length !== 1 || !entry.endsWith(".")) {
  throw new Error(`entry is not a single sentence: ${JSON.stringify(entry)}`);
}

const outDir = process.env.OUTPUT_DIR ?? "/output";
mkdirSync(outDir, { recursive: true });
// The entry text exactly, no trailing newline: a newline would add a
// character and break the single-sentence shape.
writeFileSync(`${outDir}/entry.txt`, entry, "utf8");

// Read it back and re-check: the file the grader gates must be the
// entry alone, nothing else.
const written = readFileSync(`${outDir}/entry.txt`, "utf8");
if (written !== entry) {
  throw new Error(
    `entry.txt mismatch: wrote ${JSON.stringify(entry)}, read back ${JSON.stringify(written)}`,
  );
}

console.log(`entry (${entry.length} chars): ${entry}`);
