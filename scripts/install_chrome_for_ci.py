# Copyright 2021 The Oppia Authors. All Rights Reserved.
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

"""Install Chrome for CI server.

This is meant to be run as part of CI setup. It installs the correct
version of Chrome for our CI tests and checks that the correct version
was installed.
"""

from __future__ import annotations

import re

from scripts import common


CHROME_VERSION = '102.0.5005.61-1'
URL_TEMPLATE = (
    'https://github.com/webnicer/chrome-downloads/raw/master/x64.deb/'
    'google-chrome-stable_{}_amd64.deb'
)
CHROME_DEB_FILE = 'google-chrome.deb'


def install_chrome(version: str) -> None:
    """Install Chrome from the URL in URL_TEMPLATE.

    Args:
        version: str. The version of Chrome to install. This must be one
            of the versions available from
            github.com/webnicer/chrome-downloads.
    """
    common.run_cmd(['sudo', 'apt-get', 'update'])
    common.run_cmd(['sudo', 'apt-get', 'install', 'libappindicator3-1'])
    common.run_cmd([
        'curl', '-L', '-o', CHROME_DEB_FILE,
        URL_TEMPLATE.format(version)])
    common.run_cmd([
        'sudo', 'sed', '-i',
        's|HERE/chrome\\"|HERE/chrome\\" --disable-setuid-sandbox|g',
        '/opt/google/chrome/google-chrome'])
    common.run_cmd(['sudo', 'dpkg', '-i', CHROME_DEB_FILE])


def get_chrome_version() -> str:
    """Get the current version of Chrome.

    Note that this only works on Linux systems. On macOS, for example,
    the `google-chrome` command may not work.

    Returns:
        str. The version of Chrome we found.
    """
    output = str(common.run_cmd(['google-chrome', '--version']))
    chrome_version = ''.join(re.findall(r'([0-9]|\.)', output))
    return chrome_version


def main() -> None:
    """Install Chrome and check the correct version was installed."""
    install_chrome(CHROME_VERSION)
    found_version = get_chrome_version()
    if not CHROME_VERSION.startswith(found_version):
        raise RuntimeError(
            (
                'Chrome version {} should have been installed. '
                'Version {} was found instead.'
            ).format(CHROME_VERSION, found_version)
        )
    print('Chrome version {} installed.'.format(found_version))


if __name__ == '__main__':  # pragma: no cover
    main()
