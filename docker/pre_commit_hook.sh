#!/bin/bash
#
# Copyright 2024 The Oppia Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the 'License');
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an 'AS-IS' BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# To install hook (which runs inside docker container), run this script
# command from oppia root directory with --install argument
#
# Currently it only works for Unix systems, on windows it will create symlink 
# but won't have any effect


DEV_CONTAINER="dev-server"
DOCKER_EXEC_COMMAND="docker compose exec -T $DEV_CONTAINER "

# Location of git hooks directory
HOOKS_DIR=".git/hooks"

# Path for symbolic links to hook files
PRE_COMMIT_SYMLINK="$HOOKS_DIR/pre-commit"
PYTHON_PRE_COMMIT_SYMLINK="$HOOKS_DIR/pre-commit-python"

# Path for hook files
PRE_COMMIT_FILE="docker/pre_commit_hook.sh"
PYTHON_PRE_COMMIT_FILE="scripts/pre_commit_hook.py"

# Install pre-commit hook
install_hook() {
    # Create symlinks for pre-commit hook files
    for file in "$PRE_COMMIT_SYMLINK" "$PYTHON_PRE_COMMIT_SYMLINK"; do
        # Check if pre-commit file is already a symlink
        if [ -h "$file" ] && [ -e "$file" ]; then
            echo "Symlink already exists (for $file)"

        else
            # If broken symlink, remove it
            if [ -h "$file" ] && [ ! -e "$file" ]; then
                rm "$file"
                echo "Removed broken symlink (for $file)"
            fi

            # Try creating a symlink
            if [ "$(basename $file)" == "pre-commit" ]; then
                ORIGINAL_FILE="../../$PRE_COMMIT_FILE"
            else
                ORIGINAL_FILE="../../$PYTHON_PRE_COMMIT_FILE"
            fi

            ln -s "$ORIGINAL_FILE" "$file" &&
                echo "Created symlink in .git/hooks directory" ||
                {
                    # Fallback to copy on windows
                    cp "$ORIGINAL_FILE" "$file"
                    echo "Copied file to .git/hooks directory"
                }

            # Make the hook file executable
            chmod +x "$file"

            if [ $? -eq 0 ]; then
                echo "pre-commit hook file is now executable!"
            else
                echo >&2 "Failed to make pre-commit executable"
                exit 1
            fi
        fi
    done
    exit 0
}

# Check for --install in args and install pre-commit hook if it's found
for arg in "$@"; do
    if [ "$arg" == "--install" ]; then
        install_hook
    fi
done

# Check if dev-server is running and is healthy
$(docker ps -a --format '{{json .}}' | grep $DEV_CONTAINER | jq .Status | grep -q healthy)
is_container_running=$?

if [ "$is_container_running" != "0" ]; then
    # Start containers and run pre-commit hook
    make start-devserver
fi

# Run hook in container
CMD="$DOCKER_EXEC_COMMAND python3 ./$PYTHON_PRE_COMMIT_SYMLINK $@"
echo "Running $CMD"

$CMD

# Save exit code from the docker command, so we can later use it to exit this pre-commit hook at end.
exitcode=$?
echo "Python script exited with code $exitcode"

# Shut down containers if they were not running before pre-commit hook execution.
if [ "$is_container_running" != "0" ]; then
    make stop
fi

# Exit with exit code from container
exit $exitcode
