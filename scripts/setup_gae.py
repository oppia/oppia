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

"""This file should not be invoked directly, but called from other Python
scripts. Python execution environment setup for scripts that require GAE.
"""

import os
import sys
import tarfile
import urllib
import zipfile


def main():
    """Runs the script to setup GAE."""
    curr_dir = os.path.abspath(os.getcwd())
    oppia_tools_dir = os.path.join(curr_dir, '..', 'oppia_tools')
    google_app_engine_home = os.path.join(
        oppia_tools_dir, 'google_appengine_1.9.67/google_appengine')
    google_cloud_sdk_home = os.path.join(
        oppia_tools_dir, 'google-cloud-sdk-251.0.0/google-cloud-sdk')
    coverage_home = os.path.join(oppia_tools_dir, 'coverage-4.5.4')

    # Note that if the following line is changed so that it uses webob_1_1_1,
    # PUT requests from the frontend fail.
    sys.path.append('.')
    sys.path.append(coverage_home)
    sys.path.append(google_app_engine_home)
    sys.path.append(os.path.join(google_app_engine_home, 'lib/webob_0_9'))
    sys.path.append(os.path.join(oppia_tools_dir, 'webtest-2.0.33'))

    # Delete old *.pyc files.
    for directory, _, files in os.walk('.'):
        for file_name in files:
            if file_name.endswith('.pyc'):
                filepath = os.path.join(directory, file_name)
                os.remove(filepath)

    print (
        'Checking whether Google App Engine is installed in %s'
        % google_app_engine_home)
    if not os.path.exists(google_app_engine_home):
        print 'Downloading Google App Engine (this may take a little while)...'
        os.makedirs(google_app_engine_home)
        try:
            urllib.urlretrieve(
                'https://storage.googleapis.com/appengine-sdks/featured/'
                'google_appengine_1.9.67.zip', filename='gae-download.zip')
        except Exception:
            print 'Error downloading Google App Engine. Exiting.'
            sys.exit(1)
        print 'Download complete. Installing Google App Engine...'
        with zipfile.ZipFile('gae-download.zip', 'r') as zip_ref:
            zip_ref.extractall(
                path=os.path.join(oppia_tools_dir, 'google_appengine_1.9.67/'))
        os.remove('gae-download.zip')


    print (
        'Checking whether google-cloud-sdk is installed in %s'
        % google_cloud_sdk_home)
    if not os.path.exists(google_cloud_sdk_home):
        print 'Downloading Google Cloud SDK (this may take a little while)...'
        os.makedirs(google_cloud_sdk_home)
        try:
            urllib.urlretrieve(
                'https://dl.google.com/dl/cloudsdk/channels/rapid/downloads/'
                'google-cloud-sdk-251.0.0-linux-x86_64.tar.gz',
                filename='gcloud-sdk.tar.gz')
        except Exception:
            print 'Error downloading Google Cloud SDK. Exiting.'
            sys.exit(1)
        print 'Download complete. Installing Google Cloud SDK...'
        tar = tarfile.open(name='gcloud-sdk.tar.gz')
        tar.extractall(
            path=os.path.join(oppia_tools_dir, 'google-cloud-sdk-251.0.0/'))
        tar.close()
        os.remove('gcloud-sdk.tar.gz')


if __name__ == '__main__':
    main()
