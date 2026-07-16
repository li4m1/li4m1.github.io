/* ── JANSSON TV — station programming ─────────────────────────────
   This file is the whole station. To change the broadcast:
   1. Drop an .mp4 into /music/
   2. Get its duration:  ffprobe -v error -show_entries format=duration \
        -of default=noprint_wrappers=1:nokey=1 "file.mp4"
   3. Add an entry to a playlist below. That's it.
   `dur` must match the real file duration or the live schedule drifts.
   ────────────────────────────────────────────────────────────────── */

const STATION = {
  name: 'JANSSON TELEVISION',
  callSign: 'JTV · BERLIN',
  // Fixed launch moment (UTC). All viewers sync their broadcast clock to this.
  epoch: Date.UTC(2026, 6, 13, 0, 0, 0),
  dialMin: 1,
  dialMax: 45,
};

const CHANNELS = [
  {
    num: 3,
    name: 'BOOM BAP',
    ident: 'NYC ARCHIVE',
    playlist: [
      { file: '/music/Group Home - Supa Star (Official Video) [Explicit].mp4',
        artist: 'GROUP HOME', title: 'SUPA STAR', meta: '1995 · PAYDAY', dur: 238.688 },
      { file: '/music/Artifacts - The Ultimate  [Explicit].mp4',
        artist: 'ARTIFACTS', title: 'THE ULTIMATE', meta: '1994 · BIG BEAT', dur: 262.385 },
      { file: '/music/Black Moon - Act Like U Want It (Video).mp4',
        artist: 'BLACK MOON', title: 'ACT LIKE U WANT IT', meta: '1994 · WRECK / NERVOUS', dur: 291.433 },
      { file: '/music/Kool G Rap & DJ Polo - On The Run.mp4',
        artist: 'KOOL G RAP & DJ POLO', title: 'ON THE RUN', meta: '1992 · COLD CHILLIN’', dur: 259.609 },
      { file: '/music/Group Home  - East NY Theory.mp4',
        artist: 'GROUP HOME', title: 'EAST NY THEORY', meta: '1995 · PAYDAY', dur: 267.818 },
      { file: '/music/Black Star - Respiration ft. Common.mp4',
        artist: 'BLACK STAR ft. COMMON', title: 'RESPIRATION', meta: '1999 · RAWKUS', dur: 277.845 },
      { file: '/music/Group Home - Suspended In Time.mp4',
        artist: 'GROUP HOME', title: 'SUSPENDED IN TIME', meta: '1999', dur: 191.053 },
    ],
  },
  {
    num: 7,
    name: 'PIRATE FEED',
    ident: 'LDN — SIGNAL INTERCEPTED',
    pirate: true, // lower thirds render as tape labels, not record credits
    playlist: [
      { file: '/music/stormzyfree_.mp4', artist: 'STORMZY', title: 'FREESTYLE',  meta: 'PIRATE TAPE 001', dur: 114.985 },
      { file: '/music/slewdem_.mp4',     artist: 'SLEWDEM', title: 'TAPE RIP',   meta: 'PIRATE TAPE 002', dur: 94.690 },
      { file: '/music/whereishe_.mp4',   artist: '???',     title: 'WHERE IS HE', meta: 'PIRATE TAPE 003', dur: 183.106 },
      { file: '/music/king..mp4',        artist: 'KING.',   title: 'TAPE RIP',   meta: 'PIRATE TAPE 004', dur: 144.729 },
    ],
  },
  {
    num: 12,
    name: 'OFF AIR',
    ident: 'TEST CARD',
    offair: true, // renders the color-bar test card + live clock, no video
  },
  {
    num: 41,
    name: '41SHOOTS',
    ident: 'ENCRYPTED FEED',
    card: { // easter egg — static ident card with a way out
      line1: '41SHOOTS',
      line2: 'ENCRYPTED FEED — SUBSCRIPTION CARD REQUIRED',
      href: 'https://41shoots.janssonliam.de/',
      cta: 'INSERT CARD ↗',
    },
  },
];
