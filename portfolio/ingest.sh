#!/usr/bin/env bash
# ═══ PORTFOLIO INGEST ═══════════════════════════════════════════════
#  Usage:  ./ingest.sh /path/to/folder/of/videos
#
#  Walks a folder, picks out every VERTICAL video, transcodes it down to
#  web size (max 1280 tall, H.264 CRF 26) and pulls a poster frame.
#  Prints ready-to-paste clips.js entries at the end.
#
#  Repo lives on GitHub Pages, so size is the whole point: a 30s clip
#  lands at ~1-3 MB instead of the 8-30 MB an export off the timeline is.
#  Re-running is safe, anything already in media/ is skipped.
# ════════════════════════════════════════════════════════════════════
set -euo pipefail

SRC="${1:-}"
HERE="$(cd "$(dirname "$0")" && pwd)"
# DEST puts output in a subfolder, e.g. DEST=ai -> media/ai/
DEST="${DEST:-}"
OUT="$HERE/media${DEST:+/$DEST}"
POST="$OUT/posters"

if [[ -z "$SRC" || ! -d "$SRC" ]]; then
  echo "usage: ./ingest.sh /path/to/folder/of/videos" >&2
  exit 1
fi

command -v ffmpeg  >/dev/null || { echo "ffmpeg not found (brew install ffmpeg)" >&2; exit 1; }
command -v ffprobe >/dev/null || { echo "ffprobe not found" >&2; exit 1; }

mkdir -p "$OUT" "$POST"

CRF="${CRF:-26}"            # override: CRF=24 ./ingest.sh …
MAXH="${MAXH:-1280}"        # override: MAXH=1920 ./ingest.sh …
MAXRATE="${MAXRATE:-1400k}" # hard ceiling ≈ 1.4 Mbps
BUFSIZE="${BUFSIZE:-2800k}"

entries=""
count=0
skipped=0

# slugify: "Berlin 41 FINAL.mp4" -> "berlin-41-final"
# NOTE: -E, because BSD/macOS sed has no \+ in basic regex.
slugify() {
  echo "$1" \
    | tr '[:upper:]' '[:lower:]' \
    | sed -E -e 's/\.[a-z0-9]+$//' -e 's/[^a-z0-9]+/-/g' -e 's/^-//' -e 's/-$//'
}

# ─── pass 1: probe everything, keep the highest-resolution copy per slug ───
# A folder of exports usually holds the same clip more than once (proxies,
# previews, "final v2"). Tallest source wins so we never encode off a proxy.
declare -a CAND=()
while IFS= read -r -d '' f; do
  base="$(basename "$f")"
  dims="$(ffprobe -v error -select_streams v:0 \
          -show_entries stream=width,height -of csv=p=0 "$f" 2>/dev/null | head -1 || true)"
  [[ -z "$dims" ]] && continue
  w="${dims%%,*}"; h="${dims##*,}"
  [[ -z "$w" || -z "$h" ]] && continue
  # Short form is vertical only. AI work is often 16:9, so that section
  # ingests with ALLOW_LANDSCAPE=1 and keeps whatever ratio it finds.
  # h == w is square, a native social format, so it stays. Only strictly
  # wider-than-tall is dropped from short form.
  if (( h < w )) && [[ -z "${ALLOW_LANDSCAPE:-}" ]]; then
    echo "  skip (landscape ${w}x${h})  $base"
    skipped=$((skipped+1))
    continue
  fi
  CAND+=("$h|$(slugify "$base")|$f")
done < <(find "$SRC" \
           -type d -name 'static posts' -prune -o \
           -type f \( -iname '*.mp4' -o -iname '*.mov' -o -iname '*.m4v' -o -iname '*.webm' \) \
           -not -name '._*' -print0)

declare -a PICKED=()
if ((${#CAND[@]})); then
  # sort by height descending, then first occurrence of each slug wins
  while IFS= read -r line; do
    s="${line#*|}"; s="${s%%|*}"
    dup=""
    for p in ${PICKED[@]+"${PICKED[@]}"}; do
      ps="${p#*|}"; ps="${ps%%|*}"
      [[ "$ps" == "$s" ]] && { dup=1; break; }
    done
    if [[ -n "$dup" ]]; then
      echo "  skip (dup of $s)  $(basename "${line##*|}")"
      skipped=$((skipped+1))
    else
      PICKED+=("$line")
    fi
  done < <(printf '%s\n' "${CAND[@]}" | sort -t'|' -k1,1nr)
fi

# ─── pass 2: encode ───
for line in ${PICKED[@]+"${PICKED[@]}"}; do
  h="${line%%|*}"
  rest="${line#*|}"
  slug="${rest%%|*}"
  f="${rest#*|}"
  base="$(basename "$f")"
  w="$(ffprobe -v error -select_streams v:0 -show_entries stream=width -of csv=p=0 "$f" | head -1)"
  dest="$OUT/$slug.mp4"
  poster="$POST/$slug.jpg"

  if [[ -f "$dest" ]]; then
    echo "  have        $slug.mp4"
  else
    echo "  encoding    $base  (${w}x${h})"
    # scale only if taller than MAXH, keep even dimensions for yuv420p
    # CRF for quality + maxrate ceiling so a long grainy clip can't balloon.
    # Without the cap, already-compressed social exports come out no smaller
    # than they went in.
    ffmpeg -v error -y -i "$f" \
      -vf "scale='if(gt(iw,ih),min($MAXH,iw),-2)':'if(gt(iw,ih),-2,min($MAXH,ih))':flags=lanczos" \
      -c:v libx264 -profile:v high -crf "$CRF" -preset slow -pix_fmt yuv420p \
      -maxrate "$MAXRATE" -bufsize "$BUFSIZE" \
      -c:a aac -b:a 128k -movflags +faststart \
      "$dest"
  fi

  if [[ ! -f "$poster" ]]; then
    dur="$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$dest" 2>/dev/null || echo 2)"
    # Start ~10% in to clear the fade-up, then let ffmpeg's `thumbnail` filter
    # pick the most representative frame out of the next ~120. A blind seek
    # lands on title cards and flat intro graphics; this doesn't.
    # Override a bad pick per clip:  POSTER_AT=6.5 ./ingest.sh …
    if [[ -n "${POSTER_AT:-}" ]]; then
      ffmpeg -v error -y -ss "$POSTER_AT" -i "$dest" -frames:v 1 -q:v 4 "$poster"
    else
      ss="$(awk -v d="$dur" 'BEGIN{s=d*0.10; if(s<0.2||s!=s)s=0.2; printf "%.2f", s}')"
      ffmpeg -v error -y -ss "$ss" -i "$dest" \
        -vf "thumbnail=120" -frames:v 1 -q:v 4 "$poster" 2>/dev/null \
        || ffmpeg -v error -y -ss "$ss" -i "$dest" -frames:v 1 -q:v 4 "$poster"
    fi
  fi

  ow="$(ffprobe -v error -select_streams v:0 -show_entries stream=width  -of csv=p=0 "$dest" | head -1)"
  oh="$(ffprobe -v error -select_streams v:0 -show_entries stream=height -of csv=p=0 "$dest" | head -1)"
  # Exact ratio, not a bucket. CSS aspect-ratio takes any pair, so a
  # 2750x2160 clip gets its real shape instead of being forced to 16/9
  # and letterboxed in the player.
  ar="${ow}/${oh}"
  secs="$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$dest" 2>/dev/null || echo 0)"
  dur_h="$(awk -v s="$secs" 'BEGIN{printf "%d:%02d", int(s/60), int(s%60)}')"
  title="$(echo "${base%.*}" | sed -e 's/[_-]\+/ /g' -e 's/  */ /g')"

  entries+="  { slug: \"$slug\", title: \"$title\", cat: \"brand\", platform: \"Instagram\", year: \"2026\", dur: \"$dur_h\", ar: \"$ar\", client: \"\" },"$'\n'
  count=$((count+1))
done

echo
echo "──────────────────────────────────────────────"
echo "  $count vertical clip(s) ready · $skipped landscape skipped"
du -sh "$OUT" 2>/dev/null | awk '{print "  media/ is now " $1}'
echo "──────────────────────────────────────────────"
echo
if (( count > 0 )); then
  echo "Paste into clips.js (fix cat / platform / client / year per clip):"
  echo
  printf '%s' "$entries"
fi
