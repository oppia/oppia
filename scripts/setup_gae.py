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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import argparse
import os
import sys
import tarfile
import zipfile

import python_utils

from . import common

_PARSER = argparse.ArgumentParser(description="""
Python execution environment setup for scripts that require GAE.
""")

GAE_DOWNLOAD_ZIP_PATH = os.path.join('.', 'gae-download.zip')


def main(args=None):
    """Runs the script to setup GAE."""
    unused_parsed_args = _PARSER.parse_args(args=args)
    coverage_home = os.path.join(
        common.OPPIA_TOOLS_DIR, 'coverage-%s' % common.COVERAGE_VERSION)

    # Note that if the following line is changed so that it uses webob_1_1_1,
    # PUT requests from the frontend fail.
    sys.path.append('.')
    sys.path.append(coverage_home)
    sys.path.append(common.GOOGLE_APP_ENGINE_HOME)
    sys.path.append(
        os.path.join(common.GOOGLE_APP_ENGINE_HOME, 'lib', 'webob_0_9'))
    sys.path.append(os.path.join(common.OPPIA_TOOLS_DIR, 'webtest-2.0.33'))

    # Delete old *.pyc files.
    for directory, _, files in os.walk('.'):
        for file_name in files:
            if file_name.endswith('.pyc'):
                filepath = os.path.join(directory, file_name)
                os.remove(filepath)

    python_utils.PRINT(
        'Checking whether Google App Engine is installed in %s'
        % common.GOOGLE_APP_ENGINE_HOME)
    if not os.path.exists(common.GOOGLE_APP_ENGINE_HOME):
        python_utils.PRINT(
            'Downloading Google App Engine (this may take a little while)...')
        os.makedirs(common.GOOGLE_APP_ENGINE_HOME)
        try:
            python_utils.url_retrieve(
                'https://storage.googleapis.com/appengine-sdks/featured/'
                'google_appengine_1.9.67.zip', filename='gae-download.zip')
        except Exception:
            python_utils.PRINT('Error downloading Google App Engine. Exiting.')
            raise Exception
        python_utils.PRINT('Download complete. Installing Google App Engine...')
        with zipfile.ZipFile(GAE_DOWNLOAD_ZIP_PATH, 'r') as zip_ref:
            zip_ref.extractall(
                path=os.path.join(
                    common.OPPIA_TOOLS_DIR, 'google_appengine_1.9.67/'))
        os.remove(GAE_DOWNLOAD_ZIP_PATH)


    python_utils.PRINT(
        'Checking whether google-cloud-sdk is installed in %s'
        % common.GOOGLE_CLOUD_SDK_HOME)
    if not os.path.exists(common.GOOGLE_CLOUD_SDK_HOME):
        python_utils.PRINT(
            'Downloading Google Cloud SDK (this may take a little while)...')
        os.makedirs(common.GOOGLE_CLOUD_SDK_HOME)
        try:
            python_utils.url_retrieve(
                'https://dl.google.com/dl/cloudsdk/channels/rapid/downloads/'
                'google-cloud-sdk-251.0.0-linux-x86_64.tar.gz',
                filename='gcloud-sdk.tar.gz')
        except Exception:
            python_utils.PRINT('Error downloading Google Cloud SDK. Exiting.')
            raise Exception
        python_utils.PRINT('Download complete. Installing Google Cloud SDK...')
        tar = tarfile.open(name='gcloud-sdk.tar.gz')
        tar.extractall(
            path=os.path.join(
                common.OPPIA_TOOLS_DIR, 'google-cloud-sdk-251.0.0/'))
        tar.close()
        os.remove('gcloud-sdk.tar.gz')


# The 'no coverage' pragma is used as this line is un-testable. This is because
# it will only be called when setup_gae.py is used as a script.
if __name__ == '__main__': # pragma: no cover
    main()
