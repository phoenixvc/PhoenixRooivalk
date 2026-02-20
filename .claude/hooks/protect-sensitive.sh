#!/bin/sh
# PreToolUse hook: Block writes to sensitive files (.env, keys, certs)
# Fail-closed: if jq is unavailable, block the operation

if ! command -v jq >/dev/null 2>&1; then
  echo '{"decision": "block", "reason": "jq not available — blocking write to protect sensitive files"}'
  exit 2
fi

input=$(cat)
file_path=$(echo "$input" | jq -r '.tool_input.file_path // .tool_input.file // ""' 2>/dev/null)

if [ -z "$file_path" ]; then
  exit 0
fi

case "$file_path" in
  *.env|*.env.*|*/.env|*/.env.*)
    echo '{"decision": "block", "reason": "Blocked: writing to .env files is not allowed"}'
    exit 2
    ;;
  *.key|*.pem|*.pfx|*.p12|*.cert|*.keystore|*id_rsa*|*id_ed25519*)
    echo '{"decision": "block", "reason": "Blocked: writing to key/certificate files is not allowed"}'
    exit 2
    ;;
  *credentials*|*secrets.json|*secret.json)
    echo '{"decision": "block", "reason": "Blocked: writing to credentials/secrets files is not allowed"}'
    exit 2
    ;;
  *local.settings.json)
    echo '{"decision": "block", "reason": "Blocked: writing to local.settings.json (Azure Functions secrets) is not allowed"}'
    exit 2
    ;;
  *appsettings.Production*|*appsettings.Staging*)
    echo '{"decision": "block", "reason": "Blocked: writing to production/staging config is not allowed"}'
    exit 2
    ;;
esac

exit 0
