# Copyright 2014 The Oppia Authors. All Rights Reserved.
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

from core.domain import exp_services
import feconf
import test_utils


class ImageHandlerTest(test_utils.GenericTestBase):

    TAGS = [test_utils.TestTags.SLOW_TEST]

    EDITOR_EMAIL = 'editor@example.com'

    IMAGE_UPLOAD_URL_PREFIX = '/createhandler/imageupload'
    IMAGE_VIEW_URL_PREFIX = '/imagehandler'

    def _initialize(self):
        exp_services.delete_demo('0')
        exp_services.load_demo('0')
        self.register_editor(self.EDITOR_EMAIL)

    def test_image_upload_and_download(self):
        """Test image uploading and downloading."""

        self._initialize()

        self.login(self.EDITOR_EMAIL)
        response = self.testapp.get('/create/0')
        csrf_token = self.get_csrf_token_from_response(response)

        with open(os.path.join(feconf.TESTS_DATA_DIR, 'img.png')) as f:
            raw_image = f.read()
        response_dict = self.post_json(
            '%s/0' % self.IMAGE_UPLOAD_URL_PREFIX,
            {'filename': 'test.png'},
            csrf_token=csrf_token,
            upload_files=(('image', 'unused_filename', raw_image),)
        )
        filepath = response_dict['filepath']

        self.logout()

        response = self.testapp.get(
            str('%s/0/%s' % (self.IMAGE_VIEW_URL_PREFIX, filepath)))
        self.assertEqual(response.content_type, 'image/png')
        self.assertEqual(response.body, raw_image)

    def test_upload_empty_image(self):
        """Test upload of an empty image."""

        self._initialize()

        self.login(self.EDITOR_EMAIL)
        response = self.testapp.get('/create/0')
        csrf_token = self.get_csrf_token_from_response(response)

        # Upload an empty image.
        response_dict = self.post_json(
            '%s/0' % self.IMAGE_UPLOAD_URL_PREFIX,
            {'filename': 'test.png'},
            csrf_token=csrf_token,
            expect_errors=True,
            expected_status_int=400,
            upload_files=(('image', 'unused_filename', ''),)
        )
        self.assertEqual(response_dict['code'], 400)
        self.assertEqual(response_dict['error'], 'No image supplied')

        self.logout()

    def test_upload_bad_image(self):
        """Test upload of a malformed image."""

        self._initialize()

        self.login(self.EDITOR_EMAIL)
        response = self.testapp.get('/create/0')
        csrf_token = self.get_csrf_token_from_response(response)

        # Upload a malformed image.
        response_dict = self.post_json(
            '%s/0' % self.IMAGE_UPLOAD_URL_PREFIX,
            {'filename': 'test.png'},
            csrf_token=csrf_token,
            expect_errors=True,
            expected_status_int=500,
            upload_files=(
                ('image', 'unused_filename', 'this_is_not_an_image'),)
        )
        self.assertEqual(response_dict['code'], 500)
        self.assertIn('Image file not recognized', response_dict['error'])

        self.logout()

    def test_get_invalid_image(self):
        """Test retrieval of invalid images."""

        self._initialize()

        response = self.testapp.get(
            '%s/0/bad_image' % self.IMAGE_VIEW_URL_PREFIX, expect_errors=True)
        self.assertEqual(response.status_int, 404)

    def test_bad_filenames_are_detected(self):
        # TODO(sll): Add more tests here.
        self._initialize()

        self.login(self.EDITOR_EMAIL)
        response = self.testapp.get('/create/0')
        csrf_token = self.get_csrf_token_from_response(response)

        with open(os.path.join(feconf.TESTS_DATA_DIR, 'img.png')) as f:
            raw_image = f.read()
        response_dict = self.post_json(
            '%s/0' % self.IMAGE_UPLOAD_URL_PREFIX,
            {'filename': 'test/a.png'},
            csrf_token=csrf_token,
            expect_errors=True, expected_status_int=400,
            upload_files=(('image', 'unused_filename', raw_image),),
        )
        self.assertEqual(response_dict['code'], 400)
        self.assertIn('Filenames should not include', response_dict['error'])

        self.logout()
