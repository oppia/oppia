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

from __future__ import annotations

import os

from core import feconf
from core import utils
from core.constants import constants
from core.domain import exp_services
from core.domain import fs_services
from core.domain import rights_manager
from core.domain import skill_services
from core.domain import story_services
from core.domain import topic_domain
from core.domain import topic_fetchers
from core.domain import user_services
from core.tests import test_utils


class AssetDevHandlerImageTests(test_utils.GenericTestBase):

    ASSET_HANDLER_URL_PREFIX = '/assetsdevhandler'

    def _get_image_url(self, entity_type, entity_id, filename):
        """Gets the image URL."""
        return '%s/%s/%s/assets/image/%s' % (
            self.ASSET_HANDLER_URL_PREFIX, entity_type, entity_id, filename)

    def setUp(self):
        """Load a demo exploration and register self.EDITOR_EMAIL."""
        super().setUp()

        exp_services.delete_demo('0')
        self.system_user = user_services.get_system_user()
        exp_services.load_demo('0')

        rights_manager.release_ownership_of_exploration(
            self.system_user, '0')
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)

    def test_image_upload_with_no_filename_raises_error(self):
        self.login(self.EDITOR_EMAIL)
        csrf_token = self.get_new_csrf_token()

        with utils.open_file(
            os.path.join(feconf.TESTS_DATA_DIR, 'img.png'),
            'rb', encoding=None
        ) as f:
            raw_image = f.read()
        response_dict = self.post_json(
            '%s/exploration/0' % feconf.EXPLORATION_IMAGE_UPLOAD_PREFIX, {},
            csrf_token=csrf_token,
            upload_files=(('image', 'unused_filename', raw_image),),
            expected_status_int=400)

        self.assertEqual(
            response_dict['error'], 'Missing key in handler args: filename.')

        self.logout()

    def test_get_image_with_invalid_page_context_raises_error(self):
        self.login(self.EDITOR_EMAIL)

        # Only 404 is raised here due to the try - except block in the
        # controller.
        self.get_json(
            self._get_image_url('invalid_context', '0', 'filename'),
            expected_status_int=404)
        self.logout()

    def test_image_upload_with_invalid_filename_raises_error(self):
        self.login(self.EDITOR_EMAIL)
        csrf_token = self.get_new_csrf_token()

        with utils.open_file(
            os.path.join(feconf.TESTS_DATA_DIR, 'img.png'),
            'rb', encoding=None
        ) as f:
            raw_image = f.read()
        response_dict = self.post_json(
            '%s/exploration/0' % feconf.EXPLORATION_IMAGE_UPLOAD_PREFIX,
            {'filename': '.png'},
            csrf_token=csrf_token,
            upload_files=(('image', 'unused_filename', raw_image),),
            expected_status_int=400)

        error_msg = (
            'Schema validation for \'filename\' failed: Validation'
            ' failed: is_regex_matched ({\'regex_pattern\': '
            '\'\\\\w+[.]\\\\w+\'}) for object .png'
        )
        self.assertEqual(response_dict['error'], error_msg)

        self.logout()

    def test_cannot_upload_duplicate_image(self):
        self.login(self.EDITOR_EMAIL)
        csrf_token = self.get_new_csrf_token()

        with utils.open_file(
            os.path.join(feconf.TESTS_DATA_DIR, 'img.png'),
            'rb', encoding=None
        ) as f:
            raw_image = f.read()
        response_dict = self.post_json(
            '%s/exploration/0' % feconf.EXPLORATION_IMAGE_UPLOAD_PREFIX,
            {'filename': 'test.png'},
            csrf_token=csrf_token,
            upload_files=(('image', 'unused_filename', raw_image),))

        filename = response_dict['filename']

        response = self.get_custom_response(
            self._get_image_url('exploration', '0', filename), 'image/png')
        self.assertEqual(response.body, raw_image)

        response_dict = self.post_json(
            '%s/exploration/0' % feconf.EXPLORATION_IMAGE_UPLOAD_PREFIX,
            {'filename': 'test.png'},
            csrf_token=csrf_token,
            upload_files=(('image', 'unused_filename', raw_image),),
            expected_status_int=400)

        self.assertEqual(
            response_dict['error'],
            'A file with the name test.png already exists. Please choose a '
            'different name.')

    def test_image_upload_and_download(self):
        """Test image uploading and downloading."""
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        admin_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])

        subtopic = topic_domain.Subtopic.create_default_subtopic(
            1, 'Subtopic Title', 'url-frag')
        story_id = story_services.get_new_story_id()
        topic_id = topic_fetchers.get_new_topic_id()
        skill_id = skill_services.get_new_skill_id()
        self.save_new_story(story_id, admin_id, topic_id)
        self.save_new_topic(
            topic_id, admin_id, name='Name',
            description='Description', canonical_story_ids=[story_id],
            additional_story_ids=[], uncategorized_skill_ids=[],
            subtopics=[subtopic], next_subtopic_id=2)
        self.save_new_skill(skill_id, admin_id, description='Description')

        # Page context: Exploration.
        self.login(self.EDITOR_EMAIL)
        csrf_token = self.get_new_csrf_token()

        with utils.open_file(
            os.path.join(feconf.TESTS_DATA_DIR, 'img.png'), 'rb', encoding=None
        ) as f:
            raw_image = f.read()
        response_dict = self.post_json(
            '%s/exploration/0' % feconf.EXPLORATION_IMAGE_UPLOAD_PREFIX,
            {'filename': 'test.png'},
            csrf_token=csrf_token,
            upload_files=(('image', 'unused_filename', raw_image),)
        )
        filename = response_dict['filename']

        self.logout()

        response = self.get_custom_response(
            self._get_image_url('exploration', '0', filename), 'image/png')
        self.assertEqual(response.body, raw_image)

        # Page context: Topic.
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()

        with utils.open_file(
            os.path.join(feconf.TESTS_DATA_DIR, 'img.png'), 'rb', encoding=None
        ) as f:
            raw_image = f.read()
        response_dict = self.post_json(
            '%s/topic/%s' % (
                feconf.EXPLORATION_IMAGE_UPLOAD_PREFIX, topic_id),
            {'filename': 'test.png'},
            csrf_token=csrf_token,
            upload_files=(('image', 'unused_filename', raw_image),)
        )
        filename = response_dict['filename']

        self.logout()

        response = self.get_custom_response(
            self._get_image_url('topic', topic_id, filename), 'image/png')
        self.assertEqual(response.body, raw_image)

        # Page context: Story.
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()

        with utils.open_file(
            os.path.join(feconf.TESTS_DATA_DIR, 'img.png'), 'rb',
            encoding=None
        ) as f:
            raw_image = f.read()
        response_dict = self.post_json(
            '%s/story/%s' % (
                feconf.EXPLORATION_IMAGE_UPLOAD_PREFIX, story_id),
            {'filename': 'test.png'},
            csrf_token=csrf_token,
            upload_files=(('image', 'unused_filename', raw_image),)
        )
        filename = response_dict['filename']

        self.logout()

        response = self.get_custom_response(
            self._get_image_url('story', story_id, filename), 'image/png')
        self.assertEqual(response.body, raw_image)

        # Page context: Skill.
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()

        with utils.open_file(
            os.path.join(feconf.TESTS_DATA_DIR, 'img.png'), 'rb',
            encoding=None
        ) as f:
            raw_image = f.read()
        response_dict = self.post_json(
            '%s/skill/%s' % (
                feconf.EXPLORATION_IMAGE_UPLOAD_PREFIX, skill_id),
            {'filename': 'test.png'},
            csrf_token=csrf_token,
            upload_files=(('image', 'unused_filename', raw_image),)
        )
        filename = response_dict['filename']

        self.logout()

        response = self.get_custom_response(
            self._get_image_url('skill', skill_id, filename), 'image/png')
        self.assertEqual(response.body, raw_image)

        # Image context: Question Suggestions.
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()

        with utils.open_file(
            os.path.join(feconf.TESTS_DATA_DIR, 'img.png'), 'rb',
            encoding=None
        ) as f:
            raw_image = f.read()
        response_dict = self.post_json(
            '%s/question_suggestions/%s' % (
                feconf.EXPLORATION_IMAGE_UPLOAD_PREFIX,
                skill_id
            ),
            {'filename': 'test.png'},
            csrf_token=csrf_token,
            upload_files=(('image', 'unused_filename', raw_image),)
        )
        filename = response_dict['filename']

        self.logout()

        response = self.get_custom_response(
            self._get_image_url('skill', skill_id, filename), 'image/png')
        self.assertEqual(response.body, raw_image)

    def test_non_matching_extensions_are_detected(self):
        self.login(self.EDITOR_EMAIL)
        csrf_token = self.get_new_csrf_token()

        filename_without_extension = 'test'
        supplied_filename = ('%s.jpg' % filename_without_extension)
        filename_with_correct_extension = (
            '%s.png' % filename_without_extension)

        with utils.open_file(
            os.path.join(feconf.TESTS_DATA_DIR, 'img.png'),
            'rb', encoding=None
        ) as f:
            raw_image = f.read()
        # Pass JPG extension even though raw_image data is PNG.
        # This test verifies that, when the filename extension differs from what
        # the raw data 'appears' to be, the image is rejected.
        response_dict = self.post_json(
            '%s/exploration/0' % feconf.EXPLORATION_IMAGE_UPLOAD_PREFIX,
            {'filename': supplied_filename},
            csrf_token=csrf_token,
            expected_status_int=400,
            upload_files=(('image', 'unused_filename', raw_image),)
        )
        self.assertEqual(response_dict['status_code'], 400)
        self.assertEqual(
            response_dict['error'],
            'Expected a filename ending in .png, received test.jpg')
        self.logout()

        # Test that neither form of the image is stored.
        self.get_json(
            self._get_image_url('exploration', '0', supplied_filename),
            expected_status_int=404)
        self.get_json(
            self._get_image_url(
                'exploration', '0', filename_with_correct_extension),
            expected_status_int=404)

    def test_upload_empty_image(self):
        """Test upload of an empty image."""

        self.login(self.EDITOR_EMAIL)
        csrf_token = self.get_new_csrf_token()

        # Upload an empty image.
        response_dict = self.post_json(
            '%s/exploration/0' % feconf.EXPLORATION_IMAGE_UPLOAD_PREFIX,
            {'filename': 'test.png'},
            csrf_token=csrf_token,
            expected_status_int=400,
            upload_files=(('image', 'unused_filename', ''),)
        )
        self.assertEqual(response_dict['status_code'], 400)
        self.assertEqual(response_dict['error'], 'No image supplied')

        self.logout()

    def test_upload_bad_image(self):
        """Test upload of a malformed image."""

        self.login(self.EDITOR_EMAIL)
        csrf_token = self.get_new_csrf_token()

        # Upload an invalid image.
        response_dict = self.post_json(
            '%s/exploration/0' % feconf.EXPLORATION_IMAGE_UPLOAD_PREFIX,
            {'filename': 'test.png'},
            csrf_token=csrf_token,
            expected_status_int=400,
            upload_files=(('image', 'unused_filename', 'non_image_data'),)
        )
        self.assertEqual(response_dict['status_code'], 400)
        self.assertEqual(response_dict['error'], 'Image not recognized')

        self.logout()

    def test_upload_an_invalid_svg_image(self):
        """Test upload of an invalid SVG image."""

        self.login(self.EDITOR_EMAIL)
        csrf_token = self.get_new_csrf_token()

        # Upload an invalid SVG image.
        response_dict = self.post_json(
            '%s/exploration/0' % feconf.EXPLORATION_IMAGE_UPLOAD_PREFIX,
            {'filename': 'test.svg'},
            csrf_token=csrf_token,
            expected_status_int=400,
            upload_files=(('image', 'unused_filename', '<badsvg></badsvg>'),)
        )
        self.assertEqual(response_dict['status_code'], 400)
        self.assertEqual(
            response_dict['error'],
            'Unsupported tags/attributes found in the SVG:\ntags: '
            '[\'badsvg\']\n')

        self.logout()

    def test_upload_a_large_svg(self):
        """Test upload of an SVG image that exceeds the 100 KB size limit."""

        self.login(self.EDITOR_EMAIL)
        csrf_token = self.get_new_csrf_token()

        # Upload an SVG image that exceeds the file size limit of 100 KB.
        response_dict = self.post_json(
            '%s/exploration/0' % feconf.EXPLORATION_IMAGE_UPLOAD_PREFIX,
            {'filename': 'test.svg'},
            csrf_token=csrf_token,
            expected_status_int=400,
            upload_files=((
                'image',
                'unused_filename',
                '<svg><path d="%s" /></svg>' % (
                    'M150 0 L75 200 L225 200 Z ' * 4000)),)
        )
        self.assertEqual(response_dict['status_code'], 400)
        self.assertEqual(
            response_dict['error'], 'Image exceeds file size limit of 100 KB.')

        self.logout()

    def test_get_invalid_image(self):
        """Test retrieval of invalid images."""

        self.get_json(
            self._get_image_url('exploration', '0', 'bad_image'),
            expected_status_int=404)

    def test_bad_filenames_are_detected(self):
        # TODO(sll): Add more tests here.

        self.login(self.EDITOR_EMAIL)
        csrf_token = self.get_new_csrf_token()

        with utils.open_file(
            os.path.join(feconf.TESTS_DATA_DIR, 'img.png'),
            'rb', encoding=None
        ) as f:
            raw_image = f.read()
        response_dict = self.post_json(
            '%s/exploration/0' % feconf.EXPLORATION_IMAGE_UPLOAD_PREFIX,
            {'filename': 'test/a.png'},
            csrf_token=csrf_token,
            expected_status_int=400,
            upload_files=(('image', 'unused_filename', raw_image),),
        )
        self.assertEqual(response_dict['status_code'], 400)

        error_msg = (
            'Schema validation for \'filename\' failed: Validation failed: '
            'is_regex_matched ({\'regex_pattern\': \'\\\\w+[.]\\\\w+\'}) '
            'for object test/a.png')
        self.assertIn(error_msg, response_dict['error'])

        self.logout()

    def test_missing_extensions_are_detected(self):
        self.login(self.EDITOR_EMAIL)
        csrf_token = self.get_new_csrf_token()
        with utils.open_file(
            os.path.join(feconf.TESTS_DATA_DIR, 'img.png'),
            'rb', encoding=None
        ) as f:
            raw_image = f.read()
        response_dict = self.post_json(
            '%s/exploration/0' % feconf.EXPLORATION_IMAGE_UPLOAD_PREFIX,
            {'filename': 'test'},
            csrf_token=csrf_token,
            expected_status_int=400,
            upload_files=(('image', 'unused_filename', raw_image),),
        )
        self.assertEqual(response_dict['status_code'], 400)

        error_msg = (
            'Schema validation for \'filename\' failed: Validation failed: '
            'is_regex_matched ({\'regex_pattern\': \'\\\\w+[.]\\\\w+\'}) '
            'for object test')
        self.assertIn(error_msg, response_dict['error'])

        self.logout()

    def test_bad_extensions_are_detected(self):
        self.login(self.EDITOR_EMAIL)
        csrf_token = self.get_new_csrf_token()

        with utils.open_file(
            os.path.join(feconf.TESTS_DATA_DIR, 'img.png'),
            'rb', encoding=None
        ) as f:
            raw_image = f.read()
        response_dict = self.post_json(
            '%s/exploration/0' % feconf.EXPLORATION_IMAGE_UPLOAD_PREFIX,
            {'filename': 'test.pdf'},
            csrf_token=csrf_token,
            expected_status_int=400,
            upload_files=(('image', 'unused_filename', raw_image),),
        )
        self.assertEqual(response_dict['status_code'], 400)
        self.assertIn(
            'Expected a filename ending in .png, received test.pdf',
            response_dict['error'])

        self.logout()

    def test_request_invalid_asset_type(self):
        """Test that requests for invalid asset type is rejected with a 404."""
        self.login(self.EDITOR_EMAIL)

        self.get_html_response(
            '/assetsdevhandler/exploration/0/assets/unknowntype/myfile',
            expected_status_int=404)
        self.logout()

    def test_get_response_with_dev_mode_disabled_returns_404_status(self):
        self.login(self.EDITOR_EMAIL)
        with self.swap(constants, 'EMULATOR_MODE', False):
            self.get_json(
                '/assetsdevhandler/exploration/0/assets/image/myfile',
                expected_status_int=404)
        self.logout()


class AssetDevHandlerAudioTest(test_utils.GenericTestBase):
    """Test the upload of audio files to GCS."""

    TEST_AUDIO_FILE_MP3 = 'cafe.mp3'
    TEST_AUDIO_FILE_FLAC = 'cafe.flac'
    TEST_AUDIO_FILE_OVER_MAX_LENGTH = 'cafe-over-five-minutes.mp3'
    TEST_AUDIO_FILE_MPEG_CONTAINER = 'test-mpeg-container.mp3'
    AUDIO_UPLOAD_URL_PREFIX = '/createhandler/audioupload'

    def setUp(self):
        super().setUp()
        exp_services.delete_demo('0')
        self.system_user = user_services.get_system_user()
        exp_services.load_demo('0')

        rights_manager.release_ownership_of_exploration(
            self.system_user, '0')
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)

        mock_accepted_audio_extensions = {
            'mp3': ['audio/mp3'],
            'flac': ['audio/flac']
        }

        self.accepted_audio_extensions_swap = self.swap(
            feconf, 'ACCEPTED_AUDIO_EXTENSIONS',
            mock_accepted_audio_extensions)

    def test_guest_can_not_upload(self):
        csrf_token = self.get_new_csrf_token()

        with utils.open_file(
            os.path.join(feconf.TESTS_DATA_DIR, self.TEST_AUDIO_FILE_MP3),
            'rb', encoding=None
        ) as f:
            raw_audio = f.read()
        response = self.post_json(
            '%s/0' % (self.AUDIO_UPLOAD_URL_PREFIX),
            {'filename': self.TEST_AUDIO_FILE_MP3},
            csrf_token=csrf_token,
            upload_files=(('raw_audio_file', 'unused_filename', raw_audio),),
            expected_status_int=401
        )
        self.assertEqual(
            response['error'],
            'You must be logged in to access this resource.')

    def test_cannot_upload_audio_with_invalid_exp_id(self):
        self.login(self.EDITOR_EMAIL)
        csrf_token = self.get_new_csrf_token()

        with utils.open_file(
            os.path.join(feconf.TESTS_DATA_DIR, self.TEST_AUDIO_FILE_MP3),
            'rb', encoding=None
        ) as f:
            raw_audio = f.read()
        self.post_json(
            '%s/invalid_exp_id' % (self.AUDIO_UPLOAD_URL_PREFIX),
            {'filename': self.TEST_AUDIO_FILE_MP3},
            csrf_token=csrf_token,
            upload_files=(('raw_audio_file', 'unused_filename', raw_audio),),
            expected_status_int=404
        )
        self.logout()

    def test_audio_upload(self):
        self.login(self.EDITOR_EMAIL)
        csrf_token = self.get_new_csrf_token()

        with utils.open_file(
            os.path.join(feconf.TESTS_DATA_DIR, self.TEST_AUDIO_FILE_MP3),
            'rb', encoding=None
        ) as f:
            raw_audio = f.read()
        self.post_json(
            '%s/0' % (self.AUDIO_UPLOAD_URL_PREFIX),
            {'filename': self.TEST_AUDIO_FILE_MP3},
            csrf_token=csrf_token,
            upload_files=(
                ('raw_audio_file', self.TEST_AUDIO_FILE_MP3, raw_audio),)
        )
        self.logout()

    def test_audio_upload_with_non_mp3_file(self):
        self.login(self.EDITOR_EMAIL)
        csrf_token = self.get_new_csrf_token()

        fs = fs_services.GcsFileSystem(feconf.ENTITY_TYPE_EXPLORATION, '0')

        with utils.open_file(
            os.path.join(feconf.TESTS_DATA_DIR, self.TEST_AUDIO_FILE_FLAC),
            'rb', encoding=None
        ) as f:
            raw_audio = f.read()

        self.assertFalse(fs.isfile('audio/%s' % self.TEST_AUDIO_FILE_FLAC))

        with self.accepted_audio_extensions_swap:
            self.post_json(
                '%s/0' % self.AUDIO_UPLOAD_URL_PREFIX,
                {'filename': self.TEST_AUDIO_FILE_FLAC},
                csrf_token=csrf_token,
                upload_files=[
                    ('raw_audio_file', self.TEST_AUDIO_FILE_FLAC, raw_audio)]
            )

        self.assertTrue(fs.isfile('audio/%s' % self.TEST_AUDIO_FILE_FLAC))

        self.logout()

    def test_detect_non_matching_extensions(self):
        self.login(self.EDITOR_EMAIL)
        csrf_token = self.get_new_csrf_token()

        # Use an accepted audio extension in mismatched_filename
        # that differs from the uploaded file's audio type.
        mismatched_filename = 'test.flac'
        with utils.open_file(
            os.path.join(feconf.TESTS_DATA_DIR, self.TEST_AUDIO_FILE_MP3),
            'rb', encoding=None
        ) as f:
            raw_audio = f.read()

        with self.accepted_audio_extensions_swap:
            response_dict = self.post_json(
                '%s/0' % self.AUDIO_UPLOAD_URL_PREFIX,
                {'filename': mismatched_filename},
                csrf_token=csrf_token,
                expected_status_int=400,
                upload_files=[
                    ('raw_audio_file', mismatched_filename, raw_audio)]
            )

        self.logout()
        self.assertIn(
            'Although the filename extension indicates the file is a flac '
            'file, it was not recognized as one. Found mime types:',
            response_dict['error'])

    def test_detect_non_audio_file(self):
        """Test that filenames with extensions that don't match the audio are
        detected.
        """

        self.login(self.EDITOR_EMAIL)
        csrf_token = self.get_new_csrf_token()

        with utils.open_file(
            os.path.join(feconf.TESTS_DATA_DIR, 'img.png'),
            'rb', encoding=None
        ) as f:
            raw_audio = f.read()

        with self.accepted_audio_extensions_swap:
            response_dict = self.post_json(
                '%s/0' % self.AUDIO_UPLOAD_URL_PREFIX,
                {'filename': self.TEST_AUDIO_FILE_FLAC},
                csrf_token=csrf_token,
                expected_status_int=400,
                upload_files=(('raw_audio_file', 'unused_filename', raw_audio),)
            )
        self.logout()
        self.assertEqual(
            response_dict['error'], 'Audio not recognized as a flac file')

    def test_audio_upload_mpeg_container(self):
        self.login(self.EDITOR_EMAIL)
        csrf_token = self.get_new_csrf_token()

        with utils.open_file(
            os.path.join(
                feconf.TESTS_DATA_DIR, self.TEST_AUDIO_FILE_MPEG_CONTAINER),
            'rb', encoding=None
        ) as f:
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
        csrf_token = self.get_new_csrf_token()

        filename_without_extension = 'test'
        invalid_extension = 'wav'
        supplied_filename = (
            '%s.%s' % (filename_without_extension, invalid_extension))

        with utils.open_file(
            os.path.join(feconf.TESTS_DATA_DIR, self.TEST_AUDIO_FILE_MP3),
            'rb', encoding=None
        ) as f:
            raw_audio = f.read()
        response_dict = self.post_json(
            '%s/0' % (self.AUDIO_UPLOAD_URL_PREFIX),
            {'filename': supplied_filename},
            csrf_token=csrf_token,
            expected_status_int=400,
            upload_files=(('raw_audio_file', 'unused_filename', raw_audio),)
        )
        self.logout()
        self.assertEqual(response_dict['status_code'], 400)
        self.assertEqual(
            response_dict['error'],
            'Invalid filename extension: it should have '
            'one of the following extensions: %s'
            % list(feconf.ACCEPTED_AUDIO_EXTENSIONS.keys()))

    def test_upload_empty_audio(self):
        """Test upload of empty audio."""

        self.login(self.EDITOR_EMAIL)
        csrf_token = self.get_new_csrf_token()
        # Upload empty audio.
        response_dict = self.post_json(
            '%s/0' % self.AUDIO_UPLOAD_URL_PREFIX,
            {'filename': 'test.mp3'},
            csrf_token=csrf_token,
            expected_status_int=400,
            upload_files=(('raw_audio_file', 'unused_filename', ''),)
        )
        self.logout()
        self.assertEqual(response_dict['status_code'], 400)
        self.assertEqual(response_dict['error'], 'No audio supplied')

    def test_upload_bad_audio(self):
        """Test upload of malformed audio."""

        self.login(self.EDITOR_EMAIL)
        csrf_token = self.get_new_csrf_token()
        response_dict = self.post_json(
            '%s/0' % self.AUDIO_UPLOAD_URL_PREFIX,
            {'filename': 'test.mp3'},
            csrf_token=csrf_token,
            expected_status_int=400,
            upload_files=(
                ('raw_audio_file', 'unused_filename', 'non_audio_data'),)
        )
        self.logout()
        self.assertEqual(response_dict['status_code'], 400)
        self.assertEqual(
            response_dict['error'], 'Audio not recognized as a mp3 file')

    def test_missing_extensions_are_detected(self):
        """Test upload of filenames with no extensions are caught."""

        self.login(self.EDITOR_EMAIL)
        csrf_token = self.get_new_csrf_token()

        missing_extension_filename = 'test'
        with utils.open_file(
            os.path.join(feconf.TESTS_DATA_DIR, self.TEST_AUDIO_FILE_MP3),
            'rb', encoding=None
        ) as f:
            raw_audio = f.read()
        response_dict = self.post_json(
            '%s/0' % (self.AUDIO_UPLOAD_URL_PREFIX),
            {'filename': missing_extension_filename},
            csrf_token=csrf_token,
            expected_status_int=400,
            upload_files=(('raw_audio_file', 'unused_filename', raw_audio),)
        )
        self.logout()
        self.assertEqual(response_dict['status_code'], 400)
        self.assertEqual(
            response_dict['error'],
            'No filename extension: it should have '
            'one of the following extensions: '
            '%s' % list(feconf.ACCEPTED_AUDIO_EXTENSIONS.keys()))

    def test_exceed_max_length_detected(self):
        """Test that audio file is less than max playback length."""

        self.login(self.EDITOR_EMAIL)
        csrf_token = self.get_new_csrf_token()

        with utils.open_file(
            os.path.join(
                feconf.TESTS_DATA_DIR, self.TEST_AUDIO_FILE_OVER_MAX_LENGTH),
            'rb', encoding=None
        ) as f:
            raw_audio = f.read()
        response_dict = self.post_json(
            '%s/0' % self.AUDIO_UPLOAD_URL_PREFIX,
            {'filename': 'test.mp3'},
            csrf_token=csrf_token,
            expected_status_int=400,
            upload_files=(('raw_audio_file', 'unused_filename', raw_audio),)
        )
        self.logout()
        self.assertEqual(response_dict['status_code'], 400)
        self.assertIn(
            'Audio files must be under %s seconds in length'
            % feconf.MAX_AUDIO_FILE_LENGTH_SEC, response_dict['error'])

    def test_non_matching_extensions_are_detected(self):
        """Test that filenames with extensions that don't match the audio are
        detected.
        """

        self.login(self.EDITOR_EMAIL)
        csrf_token = self.get_new_csrf_token()

        # Use an accepted audio extension in mismatched_filename
        # that differs from the uploaded file's audio type.
        mismatched_filename = 'test.mp3'
        with utils.open_file(
            os.path.join(
                feconf.TESTS_DATA_DIR, self.TEST_AUDIO_FILE_FLAC),
            'rb', encoding=None
        ) as f:
            raw_audio = f.read()
        response_dict = self.post_json(
            '%s/0' % self.AUDIO_UPLOAD_URL_PREFIX,
            {'filename': mismatched_filename},
            csrf_token=csrf_token,
            expected_status_int=400,
            upload_files=(('raw_audio_file', 'unused_filename', raw_audio),)
        )
        self.logout()
        self.assertEqual(response_dict['status_code'], 400)
        self.assertEqual(
            response_dict['error'], 'Audio not recognized as a mp3 file')

    def test_upload_check_for_duration_sec_as_response(self):
        """Tests the file upload and trying to confirm the
        audio file duration_secs is accurate.
        """
        self.login(self.EDITOR_EMAIL)
        csrf_token = self.get_new_csrf_token()

        with utils.open_file(
            os.path.join(feconf.TESTS_DATA_DIR, self.TEST_AUDIO_FILE_MP3),
            'rb', encoding=None
        ) as f:
            raw_audio = f.read()
        response_dict = self.post_json(
            '%s/0' % self.AUDIO_UPLOAD_URL_PREFIX,
            {'filename': self.TEST_AUDIO_FILE_MP3},
            csrf_token=csrf_token,
            expected_status_int=200,
            upload_files=(('raw_audio_file', 'unused_filename', raw_audio),)
        )
        self.logout()
        expected_value = ({
            'filename': self.TEST_AUDIO_FILE_MP3,
            'duration_secs': 15.255510204081633})
        self.assertEqual(response_dict, expected_value)


class PromoBarHandlerTest(test_utils.GenericTestBase):
    """Test for the PromoBarHandler."""

    def setUp(self):
        super().setUp()
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.signup(
            self.RELEASE_COORDINATOR_EMAIL, self.RELEASE_COORDINATOR_USERNAME)

        self.add_user_role(
            self.RELEASE_COORDINATOR_USERNAME,
            feconf.ROLE_ID_RELEASE_COORDINATOR)

    def test_get_promo_bar_data(self):
        response = self.get_json('/promo_bar_handler')
        self.assertEqual(
            response, {
                'promo_bar_enabled': False,
                'promo_bar_message': ''
            })

    def test_release_coordinator_able_to_update_promo_bar_config(self):
        self.login(self.RELEASE_COORDINATOR_EMAIL)

        csrf_token = self.get_new_csrf_token()

        response = self.put_json(
            '/promo_bar_handler', {
                'promo_bar_enabled': True,
                'promo_bar_message': 'New promo bar message.'
            }, csrf_token=csrf_token)
        self.assertEqual(response, {})

        response = self.get_json('/promo_bar_handler')
        self.assertEqual(
            response, {
                'promo_bar_enabled': True,
                'promo_bar_message': 'New promo bar message.'
            })

        self.logout()


class ValueGeneratorHandlerTests(test_utils.GenericTestBase):

    def test_value_generated_error(self):
        dummy_id = 'someID'
        response = self.get_json(
            '/value_generator_handler/%s' % dummy_id,
            expected_status_int=404
        )
        error_message = 'Could not find the page http://localhost/{}{}.'.format(
            'value_generator_handler/', dummy_id
        )
        self.assertEqual(response['error'], error_message)

    def test_html_response(self):
        copier_id = 'Copier'
        response = self.get_html_response(
            '/value_generator_handler/' + copier_id
        )
        self.assertIn(b'<object-editor [objType]="objType"', response.body)
