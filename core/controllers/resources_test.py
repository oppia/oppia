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

"""Tests for Oppia resource handling (e.g. templates, images)."""

import os

from core.domain import exp_services
from core.domain import rights_manager
from core.domain import user_services
from core.tests import test_utils
import feconf


class AssetDevHandlerImageTests(test_utils.GenericTestBase):

    IMAGE_UPLOAD_URL_PREFIX = '/createhandler/imageupload'
    ASSET_HANDLER_URL_PREFIX = '/assetsdevhandler'

    def _get_image_url(self, exp_id, filename):
        return str(
            '%s/%s/assets/image/%s' %
            (self.ASSET_HANDLER_URL_PREFIX, exp_id, filename))

    def setUp(self):
        """Load a demo exploration and register self.EDITOR_EMAIL."""
        super(AssetDevHandlerImageTests, self).setUp()

        exp_services.delete_demo('0')
        self.system_user = user_services.get_system_user()
        exp_services.load_demo('0')

        rights_manager.release_ownership_of_exploration(
            self.system_user, '0')
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)

    def test_image_upload_and_download(self):
        """Test image uploading and downloading."""

        self.login(self.EDITOR_EMAIL)
        response = self.testapp.get('/create/0')
        csrf_token = self.get_csrf_token_from_response(response)

        with open(os.path.join(feconf.TESTS_DATA_DIR, 'img.png'),
                  mode='rb') as f:
            raw_image = f.read()
        response_dict = self.post_json(
            '%s/0' % self.IMAGE_UPLOAD_URL_PREFIX,
            {'filename': 'test.png'},
            csrf_token=csrf_token,
            upload_files=(('image', 'unused_filename', raw_image),)
        )
        filename = response_dict['filename']

        self.logout()

        response = self.testapp.get(self._get_image_url('0', filename))
        self.assertEqual(response.content_type, 'image/png')
        self.assertEqual(response.body, raw_image)

    def test_non_matching_extensions_are_detected(self):
        self.login(self.EDITOR_EMAIL)
        response = self.testapp.get('/create/0')
        csrf_token = self.get_csrf_token_from_response(response)

        filename_without_extension = 'test'
        supplied_filename = ('%s.jpg' % filename_without_extension)
        filename_with_correct_extension = (
            '%s.png' % filename_without_extension)

        with open(os.path.join(feconf.TESTS_DATA_DIR, 'img.png'),
                  mode='rb') as f:
            raw_image = f.read()
        # Pass JPG extension even though raw_image data is PNG.
        # This test verifies that, when the filename extension differs from what
        # the raw data 'appears' to be, the image is rejected.
        response_dict = self.post_json(
            '%s/0' % self.IMAGE_UPLOAD_URL_PREFIX,
            {'filename': supplied_filename},
            csrf_token=csrf_token,
            expect_errors=True,
            expected_status_int=400,
            upload_files=(('image', 'unused_filename', raw_image),)
        )
        self.assertEqual(response_dict['status_code'], 400)
        self.assertEqual(
            response_dict['error'],
            'Expected a filename ending in .png, received test.jpg')
        self.logout()

        # Test that neither form of the image is stored.
        response = self.testapp.get(
            self._get_image_url('0', supplied_filename),
            expect_errors=True)
        self.assertEqual(response.status_int, 404)
        response = self.testapp.get(
            self._get_image_url('0', filename_with_correct_extension),
            expect_errors=True)
        self.assertEqual(response.status_int, 404)

    def test_upload_empty_image(self):
        """Test upload of an empty image."""

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
        self.assertEqual(response_dict['status_code'], 400)
        self.assertEqual(response_dict['error'], 'No image supplied')

        self.logout()

    def test_upload_bad_image(self):
        """Test upload of a malformed image."""

        self.login(self.EDITOR_EMAIL)
        response = self.testapp.get('/create/0')
        csrf_token = self.get_csrf_token_from_response(response)

        # Upload an invalid image.
        response_dict = self.post_json(
            '%s/0' % self.IMAGE_UPLOAD_URL_PREFIX,
            {'filename': 'test.png'},
            csrf_token=csrf_token,
            expect_errors=True,
            expected_status_int=400,
            upload_files=(('image', 'unused_filename', 'non_image_data'),)
        )
        self.assertEqual(response_dict['status_code'], 400)
        self.assertEqual(response_dict['error'], 'Image not recognized')

        self.logout()

    def test_get_invalid_image(self):
        """Test retrieval of invalid images."""

        response = self.testapp.get(
            self._get_image_url('0', 'bad_image'),
            expect_errors=True)
        self.assertEqual(response.status_int, 404)

    def test_bad_filenames_are_detected(self):
        # TODO(sll): Add more tests here.

        self.login(self.EDITOR_EMAIL)
        response = self.testapp.get('/create/0')
        csrf_token = self.get_csrf_token_from_response(response)

        with open(os.path.join(feconf.TESTS_DATA_DIR, 'img.png'),
                  mode='rb') as f:
            raw_image = f.read()
        response_dict = self.post_json(
            '%s/0' % self.IMAGE_UPLOAD_URL_PREFIX,
            {'filename': 'test/a.png'},
            csrf_token=csrf_token,
            expect_errors=True, expected_status_int=400,
            upload_files=(('image', 'unused_filename', raw_image),),
        )
        self.assertEqual(response_dict['status_code'], 400)
        self.assertIn('Filenames should not include', response_dict['error'])

        self.logout()

    def test_missing_extensions_are_detected(self):
        self.login(self.EDITOR_EMAIL)
        response = self.testapp.get('/create/0')
        csrf_token = self.get_csrf_token_from_response(response)

        with open(os.path.join(feconf.TESTS_DATA_DIR, 'img.png'),
                  mode='rb') as f:
            raw_image = f.read()
        response_dict = self.post_json(
            '%s/0' % self.IMAGE_UPLOAD_URL_PREFIX,
            {'filename': 'test'},
            csrf_token=csrf_token,
            expect_errors=True, expected_status_int=400,
            upload_files=(('image', 'unused_filename', raw_image),),
        )
        self.assertEqual(response_dict['status_code'], 400)
        self.assertIn('Image filename with no extension',
                      response_dict['error'])

        self.logout()

    def test_bad_extensions_are_detected(self):
        self.login(self.EDITOR_EMAIL)
        response = self.testapp.get('/create/0')
        csrf_token = self.get_csrf_token_from_response(response)

        with open(os.path.join(feconf.TESTS_DATA_DIR, 'img.png'),
                  mode='rb') as f:
            raw_image = f.read()
        response_dict = self.post_json(
            '%s/0' % self.IMAGE_UPLOAD_URL_PREFIX,
            {'filename': 'test.pdf'},
            csrf_token=csrf_token,
            expect_errors=True, expected_status_int=400,
            upload_files=(('image', 'unused_filename', raw_image),),
        )
        self.assertEqual(response_dict['status_code'], 400)
        self.assertIn('Expected a filename ending in .png, received test.pdf',
                      response_dict['error'])

        self.logout()

    def test_request_invalid_asset_type(self):
        """Test that requests for invalid asset type is rejected with a 404."""
        self.login(self.EDITOR_EMAIL)

        response = self.testapp.get(
            '/assetsdevhandler/0/assets/unknowntype/myfile',
            expect_errors=True)
        self.logout()
        self.assertEqual(response.status_int, 404)


class AssetDevHandlerAudioTest(test_utils.GenericTestBase):
    """Test the upload of audio files to GCS."""

    TEST_AUDIO_FILE_MP3 = 'cafe.mp3'
    TEST_AUDIO_FILE_FLAC = 'cafe.flac'
    TEST_AUDIO_FILE_OVER_MAX_LENGTH = 'cafe-over-five-minutes.mp3'
    TEST_AUDIO_FILE_MPEG_CONTAINER = 'test-mpeg-container.mp3'
    AUDIO_UPLOAD_URL_PREFIX = '/createhandler/audioupload'

    def setUp(self):
        super(AssetDevHandlerAudioTest, self).setUp()
        exp_services.delete_demo('0')
        self.system_user = user_services.get_system_user()
        exp_services.load_demo('0')

        rights_manager.release_ownership_of_exploration(
            self.system_user, '0')
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)

    def test_audio_upload(self):
        self.login(self.EDITOR_EMAIL)
        response = self.testapp.get('/create/0')
        csrf_token = self.get_csrf_token_from_response(response)

        with open(os.path.join(feconf.TESTS_DATA_DIR, self.TEST_AUDIO_FILE_MP3),
                  mode='rb') as f:
            raw_audio = f.read()
        self.post_json(
            '%s/0' % (self.AUDIO_UPLOAD_URL_PREFIX),
            {'filename': self.TEST_AUDIO_FILE_MP3},
            csrf_token=csrf_token,
            upload_files=(('raw_audio_file', 'unused_filename', raw_audio),)
        )
        self.logout()

    def test_audio_upload_mpeg_container(self):
        self.login(self.EDITOR_EMAIL)
        response = self.testapp.get('/create/0')
        csrf_token = self.get_csrf_token_from_response(response)

        with open(os.path.join(
            feconf.TESTS_DATA_DIR, self.TEST_AUDIO_FILE_MPEG_CONTAINER),
                  mode='rb') as f:
            raw_audio = f.read()
        self.post_json(
            '%s/0' % (self.AUDIO_UPLOAD_URL_PREFIX),
            {'filename': self.TEST_AUDIO_FILE_MPEG_CONTAINER},
            csrf_token=csrf_token,
            upload_files=(('raw_audio_file', 'unused_filename', raw_audio),)
        )
        self.logout()

    def test_invalid_extension_is_detected(self):
        """Test that invalid extensions are caught."""

        self.login(self.EDITOR_EMAIL)
        response = self.testapp.get('/create/0')
        csrf_token = self.get_csrf_token_from_response(response)

        filename_without_extension = 'test'
        invalid_extension = 'wav'
        supplied_filename = ('%s.%s'
                             % (filename_without_extension, invalid_extension))

        with open(os.path.join(feconf.TESTS_DATA_DIR, self.TEST_AUDIO_FILE_MP3),
                  mode='rb') as f:
            raw_audio = f.read()
        response_dict = self.post_json(
            '%s/0' % (self.AUDIO_UPLOAD_URL_PREFIX),
            {'filename': supplied_filename},
            csrf_token=csrf_token,
            expect_errors=True,
            expected_status_int=400,
            upload_files=(('raw_audio_file', 'unused_filename', raw_audio),)
        )
        self.logout()
        self.assertEqual(response_dict['status_code'], 400)
        self.assertEqual(
            response_dict['error'],
            'Invalid filename extension: it should have '
            'one of the following extensions: %s'
            % feconf.ACCEPTED_AUDIO_EXTENSIONS.keys())

    def test_upload_empty_audio(self):
        """Test upload of empty audio."""

        self.login(self.EDITOR_EMAIL)
        response = self.testapp.get('/create/0')
        csrf_token = self.get_csrf_token_from_response(response)

        # Upload empty audio.
        response_dict = self.post_json(
            '%s/0' % self.AUDIO_UPLOAD_URL_PREFIX,
            {'filename': 'test.mp3'},
            csrf_token=csrf_token,
            expect_errors=True,
            expected_status_int=400,
            upload_files=(('raw_audio_file', 'unused_filename', ''),)
        )
        self.logout()
        self.assertEqual(response_dict['status_code'], 400)
        self.assertEqual(response_dict['error'], 'No audio supplied')

    def test_upload_bad_audio(self):
        """Test upload of malformed audio."""

        self.login(self.EDITOR_EMAIL)
        response = self.testapp.get('/create/0')
        csrf_token = self.get_csrf_token_from_response(response)
        response_dict = self.post_json(
            '%s/0' % self.AUDIO_UPLOAD_URL_PREFIX,
            {'filename': 'test.mp3'},
            csrf_token=csrf_token,
            expect_errors=True,
            expected_status_int=400,
            upload_files=(
                ('raw_audio_file', 'unused_filename', 'non_audio_data'),)
        )
        self.logout()
        self.assertEqual(response_dict['status_code'], 400)
        self.assertEqual(response_dict['error'], 'Audio not recognized as '
                         'a mp3 file')

    def test_missing_extensions_are_detected(self):
        """Test upload of filenames with no extensions are caught."""

        self.login(self.EDITOR_EMAIL)
        response = self.testapp.get('/create/0')
        csrf_token = self.get_csrf_token_from_response(response)

        missing_extension_filename = 'test'
        with open(os.path.join(feconf.TESTS_DATA_DIR, self.TEST_AUDIO_FILE_MP3),
                  mode='rb') as f:
            raw_audio = f.read()
        response_dict = self.post_json(
            '%s/0' % (self.AUDIO_UPLOAD_URL_PREFIX),
            {'filename': missing_extension_filename},
            csrf_token=csrf_token,
            expect_errors=True,
            expected_status_int=400,
            upload_files=(('raw_audio_file', 'unused_filename', raw_audio),)
        )
        self.logout()
        self.assertEqual(response_dict['status_code'], 400)
        self.assertEqual(
            response_dict['error'],
            'No filename extension: it should have '
            'one of the following extensions: '
            '%s' % feconf.ACCEPTED_AUDIO_EXTENSIONS.keys())

    def test_exceed_max_length_detected(self):
        """Test that audio file is less than max playback length."""

        self.login(self.EDITOR_EMAIL)
        response = self.testapp.get('/create/0')
        csrf_token = self.get_csrf_token_from_response(response)

        with open(os.path.join(feconf.TESTS_DATA_DIR,
                               self.TEST_AUDIO_FILE_OVER_MAX_LENGTH),
                  mode='rb') as f:
            raw_audio = f.read()
        response_dict = self.post_json(
            '%s/0' % self.AUDIO_UPLOAD_URL_PREFIX,
            {'filename': 'test.mp3'},
            csrf_token=csrf_token,
            expect_errors=True,
            expected_status_int=400,
            upload_files=(('raw_audio_file', 'unused_filename', raw_audio),)
        )
        self.logout()
        self.assertEqual(response_dict['status_code'], 400)
        self.assertIn('Audio files must be under %s seconds in length'
                      % feconf.MAX_AUDIO_FILE_LENGTH_SEC,
                      response_dict['error'])

    def test_non_matching_extensions_are_detected(self):
        """Test that filenames with extensions that don't match the audio are
        detected.
        """

        self.login(self.EDITOR_EMAIL)
        response = self.testapp.get('/create/0')
        csrf_token = self.get_csrf_token_from_response(response)

        # Use an accepted audio extension in mismatched_filename
        # that differs from the uploaded file's audio type.
        mismatched_filename = 'test.mp3'
        with open(os.path.join(feconf.TESTS_DATA_DIR,
                               self.TEST_AUDIO_FILE_FLAC),
                  mode='rb') as f:
            raw_audio = f.read()
        response_dict = self.post_json(
            '%s/0' % self.AUDIO_UPLOAD_URL_PREFIX,
            {'filename': mismatched_filename},
            csrf_token=csrf_token,
            expect_errors=True,
            expected_status_int=400,
            upload_files=(('raw_audio_file', 'unused_filename', raw_audio),)
        )
        self.logout()
        self.assertEqual(response_dict['status_code'], 400)
        self.assertEqual(response_dict['error'], 'Audio not recognized as '
                         'a mp3 file')
