#!/bin/sh
# PostToolUse hook: Warn when uncommitted changes pile up (10+)
count=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')

if [ "$count" -ge 10 ]; then
  echo "{\"additionalContext\": \"WARNING: ${count} uncommitted changes detected. Consider committing to avoid losing work if the context window compresses.\"}"
fi

exit 0
