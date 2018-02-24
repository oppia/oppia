# Copyright 2016 The Oppia Authors. All Rights Reserved.
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

##########################################################################

# This file should not be invoked directly, but sourced from other sh scripts.

# Creates a lockfile to help with new user confusion when launching a vagrant
# vm. See https://github.com/oppia/oppia/pull/2749 for details.
#
# It can be overridden by passing --nolock to start.sh


for arg in "$@"; do
  case $arg in
    --nolock)
      NO_LOCK=true
      ;;
  esac
done

if [ $NO_LOCK ]; then
  return 0
fi

VAGRANT_LOCK_FILE="./.lock"

function vagrant_lock_cleanup {
  if [ ! $NO_CLEAN ]; then
     rm -rf $VAGRANT_LOCK_FILE
  fi
}

trap vagrant_lock_cleanup EXIT

if [ -e "$VAGRANT_LOCK_FILE" ]
then
  echo ""
  echo "  Another setup instance is already running "
  echo ""
  echo "  Please wait for that instance to complete or terminate it "
  echo ""
  echo "  If you ran $0 twice on purpose, you can override this with --nolock "
  echo ""
  NO_CLEAN=1
  return 1
else
  touch $VAGRANT_LOCK_FILE
fi
