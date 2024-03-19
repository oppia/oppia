#!/bin/bash
# Copyright 2023 The Oppia Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS-IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

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

if [ $STATUS -eq 0 ]; then
  # Healthy 
  jq '.["devserver"] = true' "$FILE" > /tmp/status.json && mv /tmp/status.json "$FILE"
  
  exit 0

else
  # Unhealthy
  jq '.["devserver"] = false' "$FILE" > /tmp/status.json && mv /tmp/status.json "$FILE"

  exit 1 
fi
