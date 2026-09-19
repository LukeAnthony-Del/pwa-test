#!/bin/bash
cat >/dev/null

root=$(git rev-parse --show-toplevel 2>/dev/null) || exit 0
cd "$root" || exit 0

git add -A
if ! git diff --cached --quiet; then
  git commit -m "Update live app"
fi

if git remote get-url origin >/dev/null 2>&1; then
  git push -u origin HEAD >/dev/null 2>&1 || true
fi

echo '{}'
exit 0
