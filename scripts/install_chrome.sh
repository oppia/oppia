# Copyright 2019 The Oppia Authors. All Rights Reserved.
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

sudo apt-get update
sudo apt-get install -y lsb-release
# https://unix.stackexchange.com/questions/228412/how-to-wget-a-github-file
curl -L "https://raw.githubusercontent.com/webnicer/chrome-downloads/master/x64.deb/google-chrome-stable_77.0.3865.75-1_amd64.deb" -o google-chrome.deb
sudo  dpkg -i google-chrome.deb
sudo apt-get -f install -y
sudo sed -i 's|HERE/chrome\"|HERE/chrome\" --disable-setuid-sandbox|g' /opt/google/chrome/google-chrome
google-chrome --version
