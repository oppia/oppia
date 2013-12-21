# Copyright 2012 Google Inc. All Rights Reserved.
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

__author__ = 'Sean Lip'

import os
import unittest

from core.domain import exp_services
import feconf
import test_utils


@unittest.skipIf(feconf.PLATFORM != 'gae',
                 'login not implemented for non-GAE platform')
class ImageHandlerTest(test_utils.GenericTestBase):

    TAGS = [test_utils.TestTags.SLOW_TEST]

    EDITOR_EMAIL = 'editor@example.com'

    def _initialize(self):
        exp_services.delete_demo('0')
        exp_services.load_demo('0')
        self.register(self.EDITOR_EMAIL)

    def test_image_upload_and_download(self):
        """Test image uploading and downloading."""

        self._initialize()

        self.login(self.EDITOR_EMAIL, is_admin=True)

        with open(os.path.join(feconf.TESTS_DATA_DIR, 'img.png')) as f:
            raw_image = f.read()
        response = self.testapp.post(
            '/imagehandler/0',
            {'filename': 'test.png'},
            upload_files=(('image', 'unused_filename', raw_image),)
        )
        filepath = self.parse_json_response(response)['filepath']

        self.logout()

        response = self.testapp.get(str('/imagehandler/0/%s' % filepath))
        self.assertEqual(response.content_type, 'image/png')
        self.assertEqual(response.body, raw_image)

    def test_upload_empty_image(self):
        """Test upload of an empty image."""

        self._initialize()

        self.login(self.EDITOR_EMAIL, is_admin=True)

        # Upload an empty image.
        response = self.testapp.post(
            '/imagehandler/0',
            {'filename': 'test.png'},
            upload_files=(('image', 'unused_filename', ''),),
            expect_errors=True
        )
        self.assertEqual(response.status_int, 400)
        parsed_response = self.parse_json_response(
            response, expect_errors=True)
        self.assertEqual(parsed_response['code'], 400)
        self.assertEqual(parsed_response['error'], 'No image supplied')

        self.logout()

    def test_upload_bad_image(self):
        """Test upload of a malformed image."""

        self._initialize()

        self.login(self.EDITOR_EMAIL, is_admin=True)

        # Upload an empty image.
        response = self.testapp.post(
            '/imagehandler/0',
            {'filename': 'test.png'},
            upload_files=(('image', 'unused_filename', 'bad_image'),),
            expect_errors=True
        )
        self.assertEqual(response.status_int, 500)
        parsed_response = self.parse_json_response(
            response, expect_errors=True)
        self.assertEqual(parsed_response['code'], 500)
        self.assertIn('Image file not recognized', parsed_response['error'])

        self.logout()

    def test_get_invalid_image(self):
        """Test retrieval of invalid images."""

        self._initialize()

        response = self.testapp.get(
            '/imagehandler/0/bad_image', expect_errors=True)
        self.assertEqual(response.status_int, 404)

    def test_unauthorized_image_upload(self):
        """Test that images can only be uploaded by an exploration editor."""

        self._initialize()

        response = self.testapp.post(
            '/imagehandler/0',
            upload_files=(('image', 'unused_filename', 'abc'),),
            expect_errors=True
        )
        self.assertEqual(response.status_int, 302)

    def test_bad_filenames_are_detected(self):
        # TODO(sll): Add more tests here.
        self._initialize()

        self.login(self.EDITOR_EMAIL, is_admin=True)

        with open(os.path.join(feconf.TESTS_DATA_DIR, 'img.png')) as f:
            raw_image = f.read()
        response = self.testapp.post(
            '/imagehandler/0',
            {'filename': 'test/a.png'},
            upload_files=(('image', 'unused_filename', raw_image),),
            expect_errors=True
        )
        self.assertEqual(response.status_int, 400)
        parsed_response = self.parse_json_response(
            response, expect_errors=True)
        self.assertEqual(parsed_response['code'], 400)
        self.assertIn('Filenames should not include', parsed_response['error'])

        self.logout()
