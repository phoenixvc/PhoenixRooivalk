#!/bin/sh
# Stop hook: remind to commit if there are uncommitted changes
changes=$(git status --porcelain 2>/dev/null | head -20)
if [ -n "$changes" ]; then
  count=$(echo "$changes" | wc -l | tr -d ' ')
  cat <<EOF
{"additionalContext": "WARNING: ${count} uncommitted change(s) detected. Remember rule #8: Git is memory, the model is not. Consider committing before ending the session.\n\nChanged files:\n${changes}"}
EOF
  exit 0
fi
exit 0
