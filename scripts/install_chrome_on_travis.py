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

"""This script should only be ran by Travis to install and provide a constant
version of Chrome.
CHROME_SOURCE_URL is an environment variable set in Oppia's Travis repo
settings. It can be found under 'Environment Variables' header here:
https://travis-ci.org/oppia/oppia/settings.
"""

import os
import subprocess
import urllib


def main():
    """Installs and provides a constant version of Chrome."""
    home_directory = os.environ.get('HOME')
    oppia_dir = os.getcwd()
    chrome_source_url = os.environ.get('CHROME_SOURCE_URL')
    travis_chrome_path = os.path.join(
        home_directory, '.cache/TravisChrome/',
        os.path.basename(chrome_source_url))

    if not os.path.isfile(travis_chrome_path):
        # Caching Chrome's Debian package after download to prevent connection
        # problem.
        os.makedirs(os.path.join(home_directory, '.cache/TravisChrome/'))
        os.chdir(os.path.join(home_directory, '.cache/TravisChrome/'))
        urllib.urlretrieve(
            chrome_source_url, filename=os.path.basename(chrome_source_url))
        os.chdir(oppia_dir)

    print 'Installing %s' % travis_chrome_path
    subprocess.call(('sudo dpkg -i %s' % travis_chrome_path).split())


if __name__ == '__main__':
    main()
