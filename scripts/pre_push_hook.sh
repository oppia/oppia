#!/bin/bash
#
# Copyright 2014 The Oppia Authors. All Rights Reserved.
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

# For this script to work properly, you need to have scripts/pre_push_hook.py
# This scripts helps running pre-push hook inside docker container by,
# working as middle layer beteen hook and pre_push_hook.py in docker
# If you can't understand whats going on here, please visit
# https://docs.google.com/document/d/1whHSUEchpmnqxSsRvHU_WYbBzeqVMh7vrjpuA8FMnAM/edit?usp=sharing
#
# To install hook (which runs inside docker container), run this script
# command from oppia root directory with --install argument

DEV_CONTAINER="dev-server"
DOCKER_EXEC_COMMAND="docker compose exec -T $DEV_CONTAINER "

PYTHON_PREPUSH_HOOK_PATH=".git/hooks/pre-push-python"
PREPUSH_HOOK_PATH=".git/hooks/pre-push"

# Get the oppia app directory
OPPIA_DIR=$(pwd)

# Location of git hooks directory
HOOKS_DIR="$OPPIA_DIR/.git/hooks"

# Path for pre-push hook file
PRE_PUSH_FILE="$HOOKS_DIR/pre-push"
PYTHON_PRE_PUSH_FILE="$HOOKS_DIR/pre-push-python"

# Install pre-push hook
install_hook() {
    # Create symlinks for pre-push hook files
    for file in "$PRE_PUSH_FILE" "$PYTHON_PRE_PUSH_FILE"; do
        # Check if pre-push file is already a symlink
        if [ -h "$file" ] && [ -e "$file" ]; then
            echo "Symlink already exists (for $file)"

        else
            # If broken symlink, remove it
            if [ -h "$file" ] && [ ! -e "$file" ]; then
                rm "$file"
                echo "Removed broken symlink (for $file)"
            fi

            # Try creating a symlink
            ln -s "$(pwd)/$(basename "$0")" "$file" &&
                echo "Created symlink in .git/hooks directory" ||
                {
                    # Fallback to copy on windows
                    cp "$(pwd)/$(basename "$0")" "$file"
                    echo "Copied file to .git/hooks directory"
                }

            # # Make the hook file executable
            # chmod +x "$file"

            # if [ $? -eq 0 ]; then
            #     echo "pre-push hook file is now executable!"
            # else
            #     echo >&2 "Failed to make pre-push executable"
            #     exit 1
            # fi
        fi
    done
    exit 0
}


# Check for --install in args and install pre-push hook if it's found
for arg in "$@"; do
    if [ "$arg" == "--install" ]; then
        install_hook
    fi
done


# Check if containers are running, so we can shut them down at end if not
WAS_RUNNING=$(docker inspect -f '{{.State.Running}}' "$DEV_CONTAINER")

# Start containers and run pre-push hook
make run-offline

# TODO: tmp
PYTHON_PREPUSH_HOOK_PATH="./scripts/pre_push_hook.py"
CMD="$DOCKER_EXEC_COMMAND python3 $PYTHON_PREPUSH_HOOK_PATH $@"
echo "Running $CMD"

$CMD

# Exit with the exit code from the docker command
exitcode=$?
echo "Python script exited with code $exitcode"

# Shut down containers if they were not running before
if [ "$WAS_RUNNING" != "false" ]; then
    make stop

exit $exitcode
