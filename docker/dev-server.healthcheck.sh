#!/bin/sh

FILE=".dev/containers-health.json"

# Create parent directories if needed
DIR=$(dirname "$FILE")
if [ ! -d "$DIR" ]; then
  mkdir -p "$DIR"
fi

# Check and create file
echo '{ "devserver": false }' > "$FILE"

# Check if devserver health is stored and reset it to false
key_to_check="devserver"
if jq -e "has(\"$key_to_check\")" "$FILE" > /dev/null; then
    jq '.["devserver"] = false' "$FILE" > /tmp/status.json && mv /tmp/status.json "$FILE"
else
    jq '. + { "devserver": false }' "$FILE" > /tmp/status.json && mv /tmp/status.json "$FILE"
fi

# Check container health
curl -f http://localhost:8181/
STATUS=$?

echo "Run Started!!" >> logs.txt
if [ $STATUS -eq 0 ]; then
  # Healthy 
  jq '.["devserver"] = true' "$FILE" > /tmp/status.json && mv /tmp/status.json "$FILE"
  
  exit 0

else
  # Unhealthy
  jq '.["devserver"] = false' "$FILE" > /tmp/status.json && mv /tmp/status.json "$FILE"

  exit 1 
fi
