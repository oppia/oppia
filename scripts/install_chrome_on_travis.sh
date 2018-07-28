# Copyright 2018 The Oppia Authors. All Rights Reserved.
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

# This script should only be ran by Travis to install and provide a constant 
# version of Chrome for Protractor.

export CHROME_SOURCE_URL=https://raw.githubusercontent.com/webnicer/chrome-downloads/master/x64.deb/google-chrome-stable_67.0.3396.99-1_amd64.deb
# Download Chrome if not already cached.
if [ ! -f $HOME/.cache/TravisChrome/google-chrome-stable_67.0.3396.99-1_amd64.deb ]; then
  mkdir -p $HOME/.cache/TravisChrome/
  curl -o $HOME/.cache/TravisChrome/google-chrome-stable_67.0.3396.99-1_amd64.deb $CHROME_SOURCE_URL
fi
echo Installing google-chrome-stable_67.0.3396.99-1_amd64
sudo dpkg -i $HOME/.cache/TravisChrome/google-chrome-stable_67.0.3396.99-1_amd64.deb
