#!/usr/bin/env bash
# ═══ CAROUSEL POST INGEST ═══════════════════════════════════════════
#  Usage:  ./ingest-posts.sh "/path/to/static posts"
#
#  Expects ONE FOLDER PER POST, each holding numbered slides:
#
#      static posts/
#        static post 1/  slide1.mov slide2.jpg … slide 10.jpg
#        static post 2/  slide01.PNG slide02.mov …
#
#  Slides may mix stills and video, the way an Instagram carousel does.
#  Order comes from the number in each filename, read numerically — so
#  "slide 10" lands after "slide9" instead of sorting next to "slide1".
#
#  Output, per post, with NN as the 1-based slide position:
#      media/posts/<slug>-NN.jpg     a still, or a video slide's poster
#      media/posts/<slug>-NN.mp4     a video slide
#      media/posts/thumbs/<slug>.jpg the grid thumbnail
# ════════════════════════════════════════════════════════════════════
set -euo pipefail

SRC="${1:-}"
HERE="$(cd "$(dirname "$0")" && pwd)"
OUT="$HERE/media/posts"
THUMBS="$OUT/thumbs"

if [[ -z "$SRC" || ! -d "$SRC" ]]; then
  echo 'usage: ./ingest-posts.sh "/path/to/folder of post folders"' >&2
  exit 1
fi
command -v ffmpeg >/dev/null || { echo "ffmpeg not found" >&2; exit 1; }
command -v sips   >/dev/null || { echo "sips not found (macOS only)" >&2; exit 1; }

mkdir -p "$OUT" "$THUMBS"

MAXPX="${MAXPX:-1440}"      # long edge, stills
MAXH="${MAXH:-1280}"        # long edge, video
QUALITY="${QUALITY:-72}"
CRF="${CRF:-26}"
MAXRATE="${MAXRATE:-1400k}"
BUFSIZE="${BUFSIZE:-2800k}"

slugify() {
  echo "$1" | tr '[:upper:]' '[:lower:]' \
    | sed -E -e 's/\.[a-z0-9]+$//' -e 's/[^a-z0-9]+/-/g' -e 's/^-//' -e 's/-$//'
}

entries=""
posts=0
slides_total=0

for dir in "$SRC"/*/; do
  [[ -d "$dir" ]] || continue
  name="$(basename "$dir")"
  slug="$(slugify "$name")"
  echo "── $name  ->  $slug"

  # Sort slides by the FIRST number in the filename. Exports often carry a
  # version suffix ("Component 37-2"); keying off the last number reads that
  # as slide 2 and throws the whole set out of order. Slide naming
  # ("slide01", "slide 10") sorts the same either way.
  # No mapfile here: macOS ships bash 3.2, which does not have it.
  ordered=()
  while IFS= read -r line; do
    [[ -n "$line" ]] && ordered+=("$line")
  done < <(
    find "$dir" -maxdepth 1 -type f \
      \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' -o -iname '*.heic' \
         -o -iname '*.mov' -o -iname '*.mp4' -o -iname '*.m4v' \) \
      -not -name '._*' -print0 |
    while IFS= read -r -d '' f; do
      b="$(basename "$f")"; b="${b%.*}"
      if [[ "$b" =~ ([0-9]+) ]]; then n="${BASH_REMATCH[1]}"; else n=0; fi
      printf '%06d\t%s\n' "$((10#$n))" "$f"
    done | sort -n | cut -f2-
  )

  (( ${#ordered[@]} )) || { echo "   (no slides)"; continue; }

  kinds=""
  ar=""
  i=0
  for f in "${ordered[@]}"; do
    i=$((i+1))
    nn="$(printf '%02d' "$i")"
    ext="${f##*.}"; ext="$(echo "$ext" | tr '[:upper:]' '[:lower:]')"

    case "$ext" in
      mov|mp4|m4v)
        dest="$OUT/$slug-$nn.mp4"
        post="$OUT/$slug-$nn.jpg"
        if [[ -f "$dest" ]]; then
          echo "   have    $slug-$nn.mp4"
        else
          echo "   video   $(basename "$f")  ->  $slug-$nn.mp4"
          ffmpeg -v error -y -i "$f" \
            -vf "scale='if(gt(iw,ih),min($MAXH,iw),-2)':'if(gt(iw,ih),-2,min($MAXH,ih))':flags=lanczos" \
            -c:v libx264 -profile:v high -crf "$CRF" -preset slow -pix_fmt yuv420p \
            -maxrate "$MAXRATE" -bufsize "$BUFSIZE" \
            -c:a aac -b:a 128k -movflags +faststart "$dest"
        fi
        [[ -f "$post" ]] || ffmpeg -v error -y -ss 0.3 -i "$dest" -frames:v 1 -q:v 4 "$post" 2>/dev/null \
                          || ffmpeg -v error -y -i "$dest" -frames:v 1 -q:v 4 "$post"
        kinds+='"video",'
        if [[ -z "$ar" ]]; then
          w="$(ffprobe -v error -select_streams v:0 -show_entries stream=width  -of csv=p=0 "$dest"|head -1)"
          h="$(ffprobe -v error -select_streams v:0 -show_entries stream=height -of csv=p=0 "$dest"|head -1)"
          ar="$w/$h"
        fi
        ;;
      *)
        dest="$OUT/$slug-$nn.jpg"
        if [[ -f "$dest" ]]; then
          echo "   have    $slug-$nn.jpg"
        else
          echo "   still   $(basename "$f")  ->  $slug-$nn.jpg"
          sips -s format jpeg -s formatOptions "$QUALITY" -Z "$MAXPX" "$f" --out "$dest" >/dev/null
        fi
        kinds+='"img",'
        if [[ -z "$ar" ]]; then
          w="$(sips -g pixelWidth  "$dest" | awk '/pixelWidth/{print $2}')"
          h="$(sips -g pixelHeight "$dest" | awk '/pixelHeight/{print $2}')"
          ar="$w/$h"
        fi
        ;;
    esac
    slides_total=$((slides_total+1))
  done

  # first slide doubles as the grid thumbnail
  [[ -f "$THUMBS/$slug.jpg" ]] || \
    sips -s format jpeg -s formatOptions "$QUALITY" -Z 640 "$OUT/$slug-01.jpg" --out "$THUMBS/$slug.jpg" >/dev/null

  title="$(echo "$name" | sed -E 's/[_-]+/ /g')"
  entries+="  { slug: \"$slug\", title: \"$title\", cat: \"brand\", platform: \"Instagram\", year: \"2026\", client: \"\", ar: \"$ar\", slides: [${kinds%,}] },"$'\n'
  posts=$((posts+1))
done

echo
echo "──────────────────────────────────────────────"
echo "  $posts post(s) · $slides_total slide(s)"
du -sh "$OUT" 2>/dev/null | awk '{print "  media/posts/ is now " $1}'
echo "──────────────────────────────────────────────"
echo
echo "Paste into posts.js (fix cat / platform / client / year per post):"
echo
printf '%s' "$entries"
