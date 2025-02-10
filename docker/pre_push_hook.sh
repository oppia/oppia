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

# For this script to work properly, you need to have scripts/pre_push_hook.py
# This scripts helps running pre-push hook inside docker container by,
# working as middle layer beteen hook and pre_push_hook.py in docker
# If you can't understand whats going on here, please visit
# https://docs.google.com/document/d/1whHSUEchpmnqxSsRvHU_WYbBzeqVMh7vrjpuA8FMnAM/edit?usp=sharing
#
# To install hook (which runs inside docker container), run this script
# command from oppia root directory with --install argument
#
# Currently it only works for Unix systems, on windows it will create symlink but won't have any effect

DEV_CONTAINER="dev-server"
DOCKER_EXEC_COMMAND="docker compose exec -T $DEV_CONTAINER "

# Location of git hooks directory
HOOKS_DIR=".git/hooks"

# Path for symbolic links to hook files
PRE_PUSH_SYMLINK="$HOOKS_DIR/pre-push"
PYTHON_PRE_PUSH_SYMLINK="$HOOKS_DIR/pre-push-python"

# Path for hook files
PRE_PUSH_FILE="docker/pre_push_hook.sh"
PYTHON_PRE_PUSH_FILE="scripts/pre_push_hook.py"

# Install pre-push hook
install_hook() {
    # Create symlinks for pre-push hook files
    for file in "$PRE_PUSH_SYMLINK" "$PYTHON_PRE_PUSH_SYMLINK"; do
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
            if [ "$(basename $file)" == "pre-push" ]; then
                ORIGINAL_FILE="../../$PRE_PUSH_FILE"
            else
                ORIGINAL_FILE="../../$PYTHON_PRE_PUSH_FILE"
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
                echo "pre-push hook file is now executable!"
            else
                echo >&2 "Failed to make pre-push executable"
                exit 1
            fi
        fi
    done
    exit 0
}

# Check for --install in args and install pre-push hook if itC's found
for arg in "$@"; do
    if [ "$arg" == "--install" ]; then
        install_hook
    fi
done

# Check if dev-server is running and is healthy
$(docker ps -a --format '{{json .}}' | grep $DEV_CONTAINER | jq .Status | grep -q healthy)
is_container_running=$?

if [ "$is_container_running" != "0" ]; then
    # Start containers and run pre-push hook
    make start-devserver # We don't need to use run-offline as internet would be available when pushing commit
fi

# Run hook in container
# Run commands in parallel and capture their outputs
python_hook_cmd="$DOCKER_EXEC_COMMAND python3 ./$PYTHON_PRE_PUSH_SYMLINK $@"
mypy_checks_cmd="make run_tests.mypy"

# Create temp files for storing outputs
python_hook_output=$(mktemp)
mypy_checks_output=$(mktemp)

# Run commands in background and redirect output to temp files
$python_hook_cmd >"$python_hook_output" 2>&1 &
python_hook_pid=$!

$mypy_checks_cmd >"$mypy_checks_output" 2>&1 &
mypy_checks_pid=$!

# Wait for both processes to complete
wait $python_hook_pid
python_hook_exit=$?

wait $mypy_checks_pid
mypy_checks_exit=$?

# Print outputs
echo "Python hook output:"
cat "$python_hook_output"
echo "Mypy checks output:"
cat "$mypy_checks_output"

# Cleanup temp files
rm "$python_hook_output"
rm "$mypy_checks_output"

# Exit with non-zero if either check failed
if [ $python_hook_exit -ne 0 ]; then
    echo "Some checks Failed!"
    exitcode=1
elif [ $mypy_checks_exit -ne 0 ]; then
    echo "MYPY checks failed!"
    exitcode=1
else
    exitcode=0
fi

# Shut down containers if they were not running before pre-push hook execution.
if [ "$is_container_running" != "0" ]; then
    make stop
fi

# Exit with exit code from container
exit $exitcode
