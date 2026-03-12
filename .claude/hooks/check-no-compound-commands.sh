#!/bin/bash
input=$(cat)
command=$(echo "$input" | jq -r '.tool_input.command')

if echo "$command" | grep -qE '&&|\|\||;'; then
  cat << 'EOF'
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "deny",
    "permissionDecisionReason": "Command contains compound operators (&&, ||, ;). Per CLI rules, execute each command as a separate Bash tool call. Use parallel tool calls for independent commands."
  }
}
EOF
fi
