#!/bin/sh
# Downloads the Latin subsets of Oswald 500/600 and Open Sans 400/600/700 from Google Fonts into ./fonts
# (GitHub raw downloads may be blocked; the old-browser user agent makes Google Fonts serve WOFF files that fontTools reads).
mkdir -p fonts
UA="Mozilla/5.0 (Windows NT 6.1) AppleWebKit/534.30 (KHTML, like Gecko) Safari/534.30"
for spec in "Oswald:wght@500" "Oswald:wght@600" "Open+Sans:wght@400" "Open+Sans:wght@600" "Open+Sans:wght@700"; do
  url=$(curl -s -A "$UA" "https://fonts.googleapis.com/css2?family=$spec" | awk '/\/\* latin \*\//{f=1} f && /src:/{print; exit}' | grep -o "https://fonts.gstatic.com[^)]*")
  name=$(echo "$spec" | sed 's/+//;s/:wght@/-/')
  curl -s -o "fonts/$name.ttf" "$url" && echo "fonts/$name.ttf"
done
