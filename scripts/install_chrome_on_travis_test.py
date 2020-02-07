# coding: utf-8
#
# Copyright 2019 The Oppia Authors. All Rights Reserved.
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

"""Unit tests for scripts/install_chrome_on_travis.py."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import os
import subprocess

from core.tests import test_utils
import python_utils
from scripts import install_chrome_on_travis


class InstallChromeOnTravisTests(test_utils.GenericTestBase):

    def test_main(self):
        chrome_source_url = (
            'https://github.com/webnicer/chrome-downloads/raw/master/x64.deb'
            '/google-chrome-stable_77.0.3865.75-1_amd64.deb')

        def mock_isfile(unused_path):
            return False

        def mock_isdir(unused_path):
            return False

        def mock_makedirs(unused_path):
            return

        def mock_chdir(unused_path):
            return

        # pylint: disable=unused-argument
        def mock_url_retrieve(unused_url, filename):
            return

        # pylint: enable=unused-argument
        def mock_check_call(unused_commands):
            return

        isdir_swap = self.swap_with_checks(
            os.path, 'isdir', mock_isdir,
            expected_args=[(os.path.join('HOME', '.cache/TravisChrome/'),)])
        makedirs_swap = self.swap_with_checks(
            os, 'makedirs', mock_makedirs,
            expected_args=[(os.path.join('HOME', '.cache/TravisChrome/'),)])
        isfile_swap = self.swap_with_checks(
            os.path, 'isfile', mock_isfile,
            expected_args=[(os.path.join(
                'HOME', '.cache/TravisChrome/',
                'google-chrome-stable_77.0.3865.75-1_amd64.deb'),)])
        chdir_swap = self.swap_with_checks(
            os, 'chdir', mock_chdir, expected_args=[
                (os.path.join('HOME', '.cache/TravisChrome/'),),
                (os.getcwd(),)])
        url_retrieve_swap = self.swap_with_checks(
            python_utils, 'url_retrieve', mock_url_retrieve,
            expected_args=[(chrome_source_url,)],
            expected_kwargs=[{
                'filename': 'google-chrome-stable_77.0.3865.75-1_amd64.deb'
            }])
        check_call_swap = self.swap_with_checks(
            subprocess, 'check_call', mock_check_call, expected_args=[(
                ['sudo', 'dpkg', '-i', os.path.join(
                    'HOME', '.cache/TravisChrome/',
                    'google-chrome-stable_77.0.3865.75-1_amd64.deb')
                ],)])
        environ_swap = self.swap(
            os, 'environ', {
                'CHROME_SOURCE_URL': chrome_source_url,
                'HOME': 'HOME'
            })
        with isdir_swap, isfile_swap, makedirs_swap, chdir_swap:
            with url_retrieve_swap, check_call_swap, environ_swap:
                install_chrome_on_travis.main(args=[])
