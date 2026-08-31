#!/usr/bin/env bash
# ═══ PORTFOLIO IMAGE INGEST ═════════════════════════════════════════
#  Usage:  ./ingest-img.sh /path/to/folder/of/images
#
#  Resizes stills for the web and builds grid thumbnails, then prints
#  ready-to-paste posts.js entries.
#
#  Carousels: name the files with a -1 -2 -3 suffix and they group into
#  one post automatically.
#      drop-1.jpg drop-2.jpg drop-3.jpg  ->  one post, 3 frames
#      lookbook.jpg                      ->  one post, 1 frame
#
#  Uses sips, which ships with macOS — reads HEIC straight off the
#  phone, and keeps this repo dependency-free like the rest of the site.
# ════════════════════════════════════════════════════════════════════
set -euo pipefail

SRC="${1:-}"
HERE="$(cd "$(dirname "$0")" && pwd)"
OUT="$HERE/media/posts"
THUMBS="$OUT/thumbs"

if [[ -z "$SRC" || ! -d "$SRC" ]]; then
  echo "usage: ./ingest-img.sh /path/to/folder/of/images" >&2
  exit 1
fi
command -v sips >/dev/null || { echo "sips not found (macOS only)" >&2; exit 1; }

mkdir -p "$OUT" "$THUMBS"

MAXPX="${MAXPX:-1440}"   # long edge of the full-size image
THUMBPX="${THUMBPX:-640}" # long edge of the grid thumb
QUALITY="${QUALITY:-72}"  # sips formatOptions, 0-100

slugify() {
  echo "$1" \
    | tr '[:upper:]' '[:lower:]' \
    | sed -E -e 's/\.[a-z0-9]+$//' -e 's/[^a-z0-9]+/-/g' -e 's/^-//' -e 's/-$//'
}

# strip a trailing -N so carousel frames collapse to one slug
basegroup() { echo "$1" | sed -E 's/-[0-9]+$//'; }

declare -a ROWS=()
while IFS= read -r -d '' f; do
  base="$(basename "$f")"
  slug="$(slugify "$base")"
  grp="$(basegroup "$slug")"
  # sort key: group, then the numeric suffix so frame order is kept.
  # Bash regex, not sed -- BSD sed has no `t` with a semicolon label.
  if [[ "$slug" =~ -([0-9]+)$ ]]; then idx="${BASH_REMATCH[1]}"; else idx=1; fi
  ROWS+=("$grp|$(printf '%03d' "$idx")|$f")
done < <(find "$SRC" -type f \
           \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' \
              -o -iname '*.heic' -o -iname '*.webp' -o -iname '*.tif' -o -iname '*.tiff' \) \
           -not -name '._*' -print0)

if ((${#ROWS[@]} == 0)); then
  echo "no images found in $SRC" >&2
  exit 0
fi

entries=""
posts=0
frames=0
current=""
n=0

while IFS= read -r row; do
  grp="${row%%|*}"
  rest="${row#*|}"
  f="${rest#*|}"

  if [[ "$grp" != "$current" ]]; then
    # close the previous group
    if [[ -n "$current" ]]; then
      title="$(echo "$current" | sed -E 's/-/ /g')"
      entries+="  { slug: \"$current\", title: \"$title\", cat: \"brand\", platform: \"Instagram\", year: \"2026\", client: \"\", imgs: $n },"$'\n'
      posts=$((posts+1))
    fi
    current="$grp"; n=0
  fi

  n=$((n+1))
  dest="$OUT/$grp-$n.jpg"

  if [[ -f "$dest" ]]; then
    echo "  have        $(basename "$dest")"
  else
    echo "  resizing    $(basename "$f")  ->  $(basename "$dest")"
    sips -s format jpeg -s formatOptions "$QUALITY" -Z "$MAXPX" "$f" --out "$dest" >/dev/null
  fi

  # first frame of the group doubles as the grid thumbnail
  if (( n == 1 )) && [[ ! -f "$THUMBS/$grp.jpg" ]]; then
    sips -s format jpeg -s formatOptions "$QUALITY" -Z "$THUMBPX" "$dest" --out "$THUMBS/$grp.jpg" >/dev/null
  fi
  frames=$((frames+1))
done < <(printf '%s\n' "${ROWS[@]}" | sort -t'|' -k1,1 -k2,2)

# close the final group
if [[ -n "$current" ]]; then
  title="$(echo "$current" | sed -E 's/-/ /g')"
  entries+="  { slug: \"$current\", title: \"$title\", cat: \"brand\", platform: \"Instagram\", year: \"2026\", client: \"\", imgs: $n },"$'\n'
  posts=$((posts+1))
fi

echo
echo "──────────────────────────────────────────────"
echo "  $posts post(s) · $frames frame(s)"
du -sh "$OUT" 2>/dev/null | awk '{print "  media/posts/ is now " $1}'
echo "──────────────────────────────────────────────"
echo
echo "Paste into posts.js (fix cat / platform / client / year per post):"
echo
printf '%s' "$entries"
