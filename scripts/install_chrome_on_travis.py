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

"""This script should only be run by Travis to install and provide a constant
version of Chrome.
"""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import argparse
import os
import subprocess

import python_utils

_PARSER = argparse.ArgumentParser(description="""
This script should only be run by Travis to install and provide a constant
version of Chrome.
""")


def main(args=None):
    """Installs and provides a constant version of Chrome."""
    unused_parsed_args = _PARSER.parse_args(args=args)
    home_directory = os.environ.get('HOME')
    oppia_dir = os.getcwd()

    # CHROME_SOURCE_URL is an environment variable set in Oppia's Travis repo
    # settings. It can be found under 'Environment Variables' header here:
    # https://travis-ci.org/oppia/oppia/settings.
    chrome_source_url = os.environ.get('CHROME_SOURCE_URL')
    travis_chrome_path = os.path.join(
        home_directory, '.cache/TravisChrome/',
        os.path.basename(chrome_source_url))

    # Caching Chrome's Debian package after download to prevent connection
    # problem.
    if not os.path.isdir(os.path.join(home_directory, '.cache/TravisChrome/')):
        os.makedirs(os.path.join(home_directory, '.cache/TravisChrome/'))

    if not os.path.isfile(travis_chrome_path):
        os.chdir(os.path.join(home_directory, '.cache/TravisChrome/'))
        python_utils.url_retrieve(
            chrome_source_url, filename=os.path.basename(chrome_source_url))
        os.chdir(oppia_dir)

    python_utils.PRINT('Installing %s' % travis_chrome_path)
    subprocess.check_call(['sudo', 'dpkg', '-i', travis_chrome_path])


if __name__ == '__main__': # pragma: no cover
    main()
