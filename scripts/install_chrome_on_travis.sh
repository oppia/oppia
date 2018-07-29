# Copyright 2018 The Oppia Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS-IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# This script should only be ran by Travis to install and provide a constant 
# version of Chrome.
# CHROME_SOURCE_URL is an environment variable set in Oppia's Travis repo settings
# It can be found under 'Environment Variables' header here: https://travis-ci.org/oppia/oppia/settings

if [ ! -f $HOME/.cache/TravisChrome/$(basename $CHROME_SOURCE_URL) ]; then
  # Caching Chrome's Debian package after download to prevent connection problem.
  mkdir -p $HOME/.cache/TravisChrome/
  cd $HOME/.cache/TravisChrome/
  # --remote-name : Write output to a file named as the remote file.
  # --location : Follow re-directs.
  curl --remote-name --location $CHROME_SOURCE_URL
  cd -
fi

echo Installing $HOME/.cache/TravisChrome/$(basename $CHROME_SOURCE_URL)
sudo dpkg -i $HOME/.cache/TravisChrome/$(basename $CHROME_SOURCE_URL)
