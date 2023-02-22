# Copyright 2019 The Oppia Authors. All Rights Reserved.
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

"""Python execution environment setup for scripts that require GAE."""

from __future__ import annotations

import argparse
import os
import subprocess
import sys
import tarfile

from typing import Optional, Sequence

from . import common

_PARSER = argparse.ArgumentParser(
    description="""
Python execution environment setup for scripts that require GAE.
""")

GAE_DOWNLOAD_ZIP_PATH = os.path.join('.', 'gae-download.zip')


def main(args: Optional[Sequence[str]] = None) -> None:
    """Runs the script to setup GAE."""
    unused_parsed_args = _PARSER.parse_args(args=args)

    sys.path.append('.')
    sys.path.append(common.GOOGLE_APP_ENGINE_SDK_HOME)

    # Delete old *.pyc files.
    for directory, _, files in os.walk('.'):
        for file_name in files:
            if file_name.endswith('.pyc'):
                filepath = os.path.join(directory, file_name)
                os.remove(filepath)

    print(
        'Checking whether google-cloud-sdk is installed in %s'
        % common.GOOGLE_CLOUD_SDK_HOME)
    if not os.path.exists(common.GOOGLE_CLOUD_SDK_HOME):
        print('Downloading Google Cloud SDK (this may take a little while)...')
        os.makedirs(common.GOOGLE_CLOUD_SDK_HOME)
        try:
            # If the google cloud version is updated here, the corresponding
            # lines (GAE_DIR and GCLOUD_PATH) in assets/release_constants.json
            # should also be updated.
            common.url_retrieve(
                'https://dl.google.com/dl/cloudsdk/channels/rapid/downloads/'
                'google-cloud-sdk-364.0.0-linux-x86_64.tar.gz',
                'gcloud-sdk.tar.gz')
        except Exception as e:
            print('Error downloading Google Cloud SDK. Exiting.')
            raise Exception('Error downloading Google Cloud SDK.') from e
        print('Download complete. Installing Google Cloud SDK...')
        tar = tarfile.open(name='gcloud-sdk.tar.gz')
        tar.extractall(
            path=os.path.join(
                common.OPPIA_TOOLS_DIR, 'google-cloud-sdk-364.0.0/'))
        tar.close()

        os.remove('gcloud-sdk.tar.gz')

    # This command installs specific google cloud components for the google
    # cloud sdk to prevent the need for developers to install it themselves when
    # the app engine development server starts up. The --quiet parameter
    # specifically tells the gcloud program to autofill all prompts with default
    # values. In this case, that means accepting all installations of gcloud
    # packages.
    subprocess.run(
        [
            common.GCLOUD_PATH, 'components', 'install', 'beta',
            'cloud-datastore-emulator', 'app-engine-python',
            'app-engine-python-extras', '--quiet',
        ],
        check=True,
    )


# The 'no coverage' pragma is used as this line is un-testable. This is because
# it will only be called when setup_gae.py is used as a script.
if __name__ == '__main__': # pragma: no cover
    main()
