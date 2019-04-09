#!/usr/bin/env bash

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

# INSTRUCTIONS:
#
# This script is only intended to be run on a vagrant ubuntu trusty machine.
# this script builds and installs python 2.7.9 and configures it to be the default system interpreter.
#

cd /home/vagrant/
wget https://www.python.org/ftp/python/2.7.9/Python-2.7.9.tgz
tar xfz Python-2.7.9.tgz
cd /home/vagrant/Python-2.7.9/
./configure --prefix /usr/local/lib/python2.7.9
sudo apt-get update
sudo apt-get install build-essential
sudo apt-get install libreadline-gplv2-dev libncursesw5-dev libssl-dev libsqlite3-dev tk-dev libgdbm-dev libc6-dev libbz2-dev
sudo make
sudo make install
sudo rm /usr/bin/python
sudo ln -s /usr/local/lib/python2.7.9/bin/python /usr/bin/python
wget https://bootstrap.pypa.io/get-pip.py
sudo python get-pip.py
sudo rm /usr/bin/pip
rm get-pip.py
sudo ln -s /usr/local/lib/python2.7.9/bin/pip /usr/bin/pip


